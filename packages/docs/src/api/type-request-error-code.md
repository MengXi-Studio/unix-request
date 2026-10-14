# RequestErrorCode

统一错误码，`string` 字面量联合类型（对标 AxiosError code 体系；原生 errCode 由 [RequestError](./type-request-error) 的 `nativeErrCode` 原值透传不翻译）。

```uts
export type RequestErrorCode =
	| 'ERR_PARAM' // 参数非法（url 为空等）
	| 'ERR_CONFIG' // 配置非法（未设 baseURL 却用相对路径等）
	| 'ERR_CANCELED' // 主动取消（cancelToken）
	| 'ERR_TIMEOUT' // 超时（原生 errCode 5 归类）
	| 'ERR_NETWORK' // 网络错误（原生 600003 等网络类归类）
	| 'ERR_BAD_REQUEST' // HTTP 4xx（validateStatus 未通过且 statusCode < 500）
	| 'ERR_BAD_RESPONSE' // HTTP 5xx（validateStatus 未通过且 statusCode >= 500）
	| 'ERR_NATIVE' // 其余原生失败
```

## 错误码明细

| code | 触发场景 | 发网络 | `nativeErrCode` | `statusCode` | `response` |
| --- | --- | --- | --- | --- | --- |
| `ERR_PARAM` | 参数非法：`url` 为空串等，发送前 fail-fast | 否 | `null` | `null` | `null` |
| `ERR_CONFIG` | 配置非法：相对路径请求且无 baseURL（含全局默认），发送前 fail-fast | 否 | `null` | `null` | `null` |
| `ERR_CANCELED` | 主动取消：[cancelToken](./type-cancel) 发送前已取消，或飞行中被 `cancel()` abort | 视时机 | `null` | `null` | `null` |
| `ERR_TIMEOUT` | 请求超时（原生 fail errCode `5` 归类） | 是 | `5` | `null` | `null` |
| `ERR_NETWORK` | 网络错误（原生 errCode `600003` 网络中断 / `600010` Cronet 模块加载失败等网络类归类） | 是 | 原值 | `null` | `null` |
| `ERR_BAD_REQUEST` | HTTP 4xx：响应到达但 `validateStatus`（默认 2xx）未通过且 `statusCode < 500` | 是 | `null` | 4xx 值 | 挂响应原文 |
| `ERR_BAD_RESPONSE` | HTTP 5xx：响应到达但 `validateStatus` 未通过且 `statusCode >= 500` | 是 | `null` | 5xx 值 | 挂响应原文 |
| `ERR_NATIVE` | 其余原生失败（`1000` / `100001–100003` / `600008` / `600009` / `602001` 等，`nativeErrCode` 原值透传）；以及拦截器 / transform 执行异常（`nativeErrCode` 为 `null`） | 触点不一 | 原值或 `null` | `null` | `null` |

## 归类规则

确定性映射，无歧义分支：

1. **发送前**（参数 / 配置校验、取消预检）→ `ERR_PARAM` / `ERR_CONFIG` / `ERR_CANCELED`，不发网络；
2. **原生 fail** → 按原生 errCode 归类：`5` → `ERR_TIMEOUT`、`600003` / `600010` → `ERR_NETWORK`、其余 → `ERR_NATIVE`；取消语义优先（token 已取消一律 `ERR_CANCELED`）；
3. **响应到达但校验未通过** → 4xx `ERR_BAD_REQUEST` / 5xx `ERR_BAD_RESPONSE`，`response` 挂载响应原文。

::: tip 与原生 errCode 的关系
库内 code 是稳定的业务分支依据；`nativeErrCode` 保留原生原值，供排查底层细节。两者同看：`e.code === 'ERR_TIMEOUT' && e.nativeErrCode === 5`。
:::

## 示例

```uts
import { request } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

request<UTSJSONObject>({ url: '/api/data' }).catch((err) => {
	const e = err as RequestError
	switch (e.code) {
		case 'ERR_CANCELED':
			// 被取消，静默即可
			break
		case 'ERR_TIMEOUT':
			console.log('超时，原生 errCode=' + e.nativeErrCode)
			break
		case 'ERR_BAD_REQUEST':
		case 'ERR_BAD_RESPONSE':
			console.log('HTTP ' + e.statusCode + '，body=' + (e.response?.data ?? ''))
			break
		default:
			console.log(e.errMsg)
	}
})
```

## 相关 API

- [RequestError](./type-request-error)
- [CancelToken / CancelSource](./type-cancel)（`ERR_CANCELED` 来源）
- [错误处理](../guide/error-handling)
