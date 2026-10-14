# RequestError

The unified error structure rejected on failure by all APIs ([request()](./request), the [shortcut methods](./quick-methods), instance methods), mirroring AxiosError: a `code` error-code system + `config` / `response` attachments + the native errCode preserved.

```uts
export type RequestError = {
	/** Library error code (literal union) */
	code: RequestErrorCode
	/** Fixed subject, handy for business-side filtering */
	errSubject: string
	/** Error description */
	errMsg: string
	/** Native fail errCode passed through as-is (5 / 600003 / …); null for library errors */
	nativeErrCode: number | null
	/** HTTP status code (for BAD_REQUEST / BAD_RESPONSE) */
	statusCode: number | null
	/** The final merged configuration that issued this request (mirrors axios error.config) */
	config: RequestConfig | null
	/** Carries the raw response on HTTP errors (including the 4xx/5xx body, mirrors axios error.response) */
	response: ResponseAny | null
}
```

## Fields

| Name | Type | Description |
| --- | --- | --- |
| `code` | [RequestErrorCode](./type-request-error-code) | Library error code, classified deterministically; the single basis for business branching |
| `errSubject` | `string` | Fixed `'unix-request'` (entry constant `REQUEST_ERR_SUBJECT`), so business code can filter this library's errors |
| `errMsg` | `string` | Error description. Passes through the native errMsg on native failures; on cancellation reads like `请求已取消：页面卸载` ("request canceled: page unloaded") |
| `nativeErrCode` | `number \| null` | The native fail errCode **passed through as-is, unmapped** (e.g. timeout `5`, network interruption `600003`); `null` for library errors |
| `statusCode` | `number \| null` | HTTP status code, present only for `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` |
| `config` | `RequestConfig \| null` | The final merged configuration that issued this request (send snapshot), for replaying requests or log instrumentation |
| `response` | `ResponseAny \| null` | Carries the **raw response** on HTTP errors (including the 4xx/5xx body), present only for `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` |

## Error Classification at a Glance

| Stage | Classification | `nativeErrCode` | `statusCode` | `response` |
| --- | --- | --- | --- | --- |
| Pre-send parameter check (empty url) | `ERR_PARAM` | `null` | `null` | `null` |
| Pre-send configuration check (relative path without baseURL) | `ERR_CONFIG` | `null` | `null` | `null` |
| Cancellation (canceled before send / aborted in flight) | `ERR_CANCELED` | `null` | `null` | `null` |
| Native timeout (errCode 5) | `ERR_TIMEOUT` | `5` | `null` | `null` |
| Native network error (600003 / 600010) | `ERR_NETWORK` | original value | `null` | `null` |
| HTTP 4xx (validateStatus failed) | `ERR_BAD_REQUEST` | `null` | the 4xx value | raw response attached |
| HTTP 5xx (validateStatus failed) | `ERR_BAD_RESPONSE` | `null` | the 5xx value | raw response attached |
| Other native failures (1000 / 100001–100003 / 600008 / 600009 / 602001, etc.) and library-level interceptor / transform exceptions | `ERR_NATIVE` | original value or `null` | `null` | `null` |

::: tip Second use of errSubject
The interceptor `onRejected` return-value detection also relies on this contract: a returned object with `errSubject === 'unix-request'` is treated as a `RequestError` (error swap), otherwise as a `ResponseResult` (recovery). Use the library's error structure when swapping errors; see [Interceptor API](./interceptors).
:::

## Examples

```uts
import { request } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

request<UTSJSONObject>({ url: '/api/missing' }).catch((err) => {
	const e = err as RequestError
	console.log(e.errSubject)     // unix-request
	console.log(e.code)           // ERR_BAD_REQUEST
	console.log(e.statusCode)     // 404
	console.log(e.response?.data) // the error body returned by the server
	console.log(e.config.url)     // the full URL actually sent
})
```

## Related APIs

- [RequestErrorCode](./type-request-error-code)
- [ResponseResult](./type-response) (the structure of the `response` field)
- [RequestConfig](./type-request-config) (the structure of the `config` field)
- [Error Handling](../guide/error-handling)
