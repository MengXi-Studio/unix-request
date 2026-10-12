# 错误处理

unix-request 把 `uni.request` 分散的错误语义（回调 fail 的原生 errCode、HTTP statusCode、取消、参数校验）收敛为统一的 `RequestError`（对标 AxiosError），所有请求失败一律以它 reject。

## RequestError 字段表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | `RequestErrorCode` | 库内错误码，8 类字面量联合（见下表） |
| `errSubject` | `string` | 固定 `'unix-request'`，用于业务过滤本库错误（常量 `REQUEST_ERR_SUBJECT`） |
| `errMsg` | `string` | 错误描述；原生失败时为原生 errMsg 透传 |
| `nativeErrCode` | `number \| null` | 原生 fail errCode **原值透传不翻译**（5 / 600003 / …）；库内错误为 `null` |
| `statusCode` | `number \| null` | HTTP 状态码（仅 `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` 时有值） |
| `config` | `RequestConfig \| null` | 发起该请求的最终合并配置（发送快照） |
| `response` | `ResponseAny \| null` | HTTP 错误时携带**响应原文**（含 4xx/5xx body），其余为 `null` |

## 八类错误码

| code | 触发场景 | 发网络 | nativeErrCode | statusCode | response |
| --- | --- | --- | --- | --- | --- |
| `ERR_PARAM` | 参数非法（url 为空等） | 否 | `null` | `null` | `null` |
| `ERR_CONFIG` | 配置非法（未设 baseURL 却用相对路径） | 否 | `null` | `null` | `null` |
| `ERR_CANCELED` | cancelToken 主动取消（发送前或飞行中） | 视时机 | `null` | `null` | `null` |
| `ERR_TIMEOUT` | 超时（原生 errCode 5 归类） | 是 | `5` | `null` | `null` |
| `ERR_NETWORK` | 网络错误（原生 600003 / 600010 归类） | 是 | 原值 | `null` | `null` |
| `ERR_BAD_REQUEST` | HTTP 4xx（validateStatus 未通过且 statusCode < 500） | 是 | `null` | 4xx 值 | 响应原文 |
| `ERR_BAD_RESPONSE` | HTTP 5xx（validateStatus 未通过且 statusCode >= 500） | 是 | `null` | 5xx 值 | 响应原文 |
| `ERR_NATIVE` | 其余原生失败（1000 / 100001–100003 / 600008 / 600009 / 602001 等）与拦截器 / transform 异常 | 视场景 | 原值（原生失败时） | `null` | `null` |

归类是**确定性映射**，无歧义分支；`nativeErrCode` 一律原值透传，不做翻译与二次映射——需要区分更细的原生语义时以它为准。

## 基础处理模式

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestError, ResponseAny } from '@/uni_modules/ux-request'

get<any>('/api/user/1', null).catch((err) => {
	const e = err as RequestError
	if (e.code == 'ERR_CANCELED') {
		return // 取消不算异常，静默即可
	}
	if (e.code == 'ERR_BAD_REQUEST' || e.code == 'ERR_BAD_RESPONSE') {
		let sc = 'null'
		if (e.statusCode != null) {
			sc = e.statusCode.toString()
		}
		const resp = e.response
		if (resp != null) {
			console.log('HTTP ' + sc + ' body=' + JSON.stringify(resp.data))
		}
		return
	}
	console.log(e.code + ' ' + e.errMsg)
})
```

## HTTP 错误挂载响应原文

4xx / 5xx 时 `err.response` 是完整响应对象，服务端返回的错误 body（如 `{ "message": "not found" }`）就在 `response.data` 里：

```uts
request<any>({ url: '/api/http/statusCode/404' }).catch((err) => {
	const e = err as RequestError
	// e.code === 'ERR_BAD_REQUEST'
	// e.statusCode === 404
	// e.response.statusCode === 404，e.response.data === 服务端 404 响应体
	// e.config.url === 实际请求的完整地址
})
```

## errSubject 过滤模式

`errSubject` 固定为 `'unix-request'`。当错误可能来自多层（如响应拦截器换错、多个库混合、原生回调透传）时，用它做来源过滤：

```uts
import { REQUEST_ERR_SUBJECT } from '@/uni_modules/ux-request'

if (e.errSubject === REQUEST_ERR_SUBJECT) {
	// 确定是本库抛出的错误
}
```

## 配合拦截器做集中处理

两段式分工最清晰：拦截器里做**上报与可恢复错误的兜底**，调用侧只处理业务性失败：

```uts
import { useResponseInterceptor } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

useResponseInterceptor(null, (err: RequestError): any | null => {
	report(err) // 全局上报
	if (err.code == 'ERR_TIMEOUT') {
		return makeFallback() // 也可以选择恢复：返回 ResponseAny 转成功
	}
	return null // 其余放行给业务侧 catch
})
```

- 需要把特定错误「转成功」→ 拦截器恢复路径，见[拦截器](./interceptors)；
- 需要区分原生明细 → 读 `nativeErrCode`，归类映射关系见[请求流程原理](./request-flow)；
- 各端超时 / 网络错误的表现差异（如 Web 端不可路由地址可能归类 `ERR_NETWORK`）→ 见[平台兼容性](./compatibility)。

类型定义见 API 文档 [RequestError](../api/type-request-error) 与 [RequestErrorCode](../api/type-request-error-code)。
