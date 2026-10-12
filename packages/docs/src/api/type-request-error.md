# RequestError

所有 API（[request()](./request)、[快捷方法](./quick-methods)、实例方法）失败时 reject 的统一错误结构，对标 AxiosError：`code` 错误码体系 + `config` / `response` 挂载 + 原生 errCode 不丢失。

```uts
export type RequestError = {
	/** 库内错误码（字面量联合） */
	code: RequestErrorCode
	/** 固定主题，便于业务过滤 */
	errSubject: string
	/** 错误描述 */
	errMsg: string
	/** 原生 fail errCode 原值透传（5 / 600003 / …），库内错误为 null */
	nativeErrCode: number | null
	/** HTTP 状态码（BAD_REQUEST / BAD_RESPONSE 时） */
	statusCode: number | null
	/** 发起该请求的最终合并配置（axios error.config 对标） */
	config: RequestConfig | null
	/** HTTP 错误时携带响应原文（含 4xx/5xx body，axios error.response 对标） */
	response: ResponseAny | null
}
```

## 字段

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `code` | [RequestErrorCode](./type-request-error-code) | 库内错误码，确定性归类，业务分支判断的唯一依据 |
| `errSubject` | `string` | 固定 `'unix-request'`（入口常量 `REQUEST_ERR_SUBJECT`），便于业务过滤本库错误 |
| `errMsg` | `string` | 错误描述。原生失败时透传原生 errMsg；取消时形如 `请求已取消：页面卸载` |
| `nativeErrCode` | `number \| null` | 原生 fail 的 errCode **原值透传不翻译**（如超时 `5`、网络中断 `600003`）；库内错误为 `null` |
| `statusCode` | `number \| null` | HTTP 状态码，仅 `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` 时有值 |
| `config` | `RequestConfig \| null` | 发起该请求的最终合并配置（发送快照），复现请求或埋点日志时使用 |
| `response` | `ResponseAny \| null` | HTTP 错误时携带**响应原文**（含 4xx/5xx body），仅 `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` 时有值 |

## 错误归类一览

| 阶段 | 归类 | `nativeErrCode` | `statusCode` | `response` |
| --- | --- | --- | --- | --- |
| 发送前参数校验（url 为空） | `ERR_PARAM` | `null` | `null` | `null` |
| 发送前配置校验（相对路径无 baseURL） | `ERR_CONFIG` | `null` | `null` | `null` |
| 取消（发送前已取消 / 飞行中 abort） | `ERR_CANCELED` | `null` | `null` | `null` |
| 原生超时（errCode 5） | `ERR_TIMEOUT` | `5` | `null` | `null` |
| 原生网络错误（600003 / 600010） | `ERR_NETWORK` | 原值 | `null` | `null` |
| HTTP 4xx（validateStatus 未通过） | `ERR_BAD_REQUEST` | `null` | 4xx 值 | 挂响应原文 |
| HTTP 5xx（validateStatus 未通过） | `ERR_BAD_RESPONSE` | `null` | 5xx 值 | 挂响应原文 |
| 其余原生失败（1000 / 100001–100003 / 600008 / 600009 / 602001 等）与库内拦截器 / transform 异常 | `ERR_NATIVE` | 原值或 `null` | `null` | `null` |

::: tip errSubject 的第二个用途
拦截器 `onRejected` 的返回值判别也基于本契约：返回对象带 `errSubject === 'unix-request'` 视为 `RequestError`（换错），否则视为 `ResponseResult`（恢复）。业务换错时请沿用库内错误结构，见[拦截器 API](./interceptors)。
:::

## 示例

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<UTSJSONObject>({ url: '/api/missing' }).catch((err) => {
	const e = err as RequestError
	console.log(e.errSubject)     // unix-request
	console.log(e.code)           // ERR_BAD_REQUEST
	console.log(e.statusCode)     // 404
	console.log(e.response?.data) // 服务端返回的错误 body
	console.log(e.config.url)     // 最终发送的完整 URL
})
```

## 相关 API

- [RequestErrorCode](./type-request-error-code)
- [ResponseResult](./type-response)（`response` 字段的结构）
- [RequestConfig](./type-request-config)（`config` 字段的结构）
- [错误处理](../guide/error-handling)
