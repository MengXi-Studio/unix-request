# Error Handling

unix-request converges the scattered error semantics of `uni.request` (native errCode from fail callbacks, HTTP statusCode, cancellation, parameter validation) into a unified `RequestError` (mirroring AxiosError); every request failure rejects with it.

## RequestError Fields

| Field | Type | Description |
| --- | --- | --- |
| `code` | `RequestErrorCode` | The library error code, a union of 8 literals (see table below) |
| `errSubject` | `string` | Always `'unix-request'`, for business-side filtering of this library's errors (the constant `REQUEST_ERR_SUBJECT`) |
| `errMsg` | `string` | Error description; when the native layer fails, this is the native errMsg passed through |
| `nativeErrCode` | `number \| null` | The native fail errCode **passed through with its original value, never translated** (5 / 600003 / …); `null` for library errors |
| `statusCode` | `number \| null` | HTTP status code (only present for `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE`) |
| `config` | `RequestConfig \| null` | The final merged config of the request (the send snapshot) |
| `response` | `ResponseAny \| null` | For HTTP errors, carries the **raw response** (including the 4xx/5xx body); `null` otherwise |

## The 8 Error Codes

| code | Trigger scenario | Sends network | nativeErrCode | statusCode | response |
| --- | --- | --- | --- | --- | --- |
| `ERR_PARAM` | Invalid parameters (empty url, etc.) | No | `null` | `null` | `null` |
| `ERR_CONFIG` | Invalid config (relative path without baseURL) | No | `null` | `null` | `null` |
| `ERR_CANCELED` | Canceled via cancelToken (pre-send or in flight) | Depends on timing | `null` | `null` | `null` |
| `ERR_TIMEOUT` | Timeout (native errCode 5 classified) | Yes | `5` | `null` | `null` |
| `ERR_NETWORK` | Network error (native 600003 / 600010 classified) | Yes | Original value | `null` | `null` |
| `ERR_BAD_REQUEST` | HTTP 4xx (validateStatus failed and statusCode < 500) | Yes | `null` | The 4xx value | Raw response |
| `ERR_BAD_RESPONSE` | HTTP 5xx (validateStatus failed and statusCode >= 500) | Yes | `null` | The 5xx value | Raw response |
| `ERR_NATIVE` | Other native failures (1000 / 100001–100003 / 600008 / 600009 / 602001, etc.) and interceptor / transform exceptions | Depends on scenario | Original value (on native failure) | `null` | `null` |

Classification is a **deterministic mapping** with no ambiguous branches; `nativeErrCode` is always passed through with its original value, never translated or re-mapped — rely on it when you need to distinguish finer native semantics.

## Basic Handling Pattern

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestError, ResponseAny } from '@/uni_modules/ux-request'

get<any>('/api/user/1', null).catch((err) => {
	const e = err as RequestError
	if (e.code == 'ERR_CANCELED') {
		return // cancellation is not an anomaly; stay silent
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

## HTTP Errors Carry the Raw Response

For 4xx / 5xx, `err.response` is the complete response object; the error body returned by the server (e.g. `{ "message": "not found" }`) is right there in `response.data`:

```uts
request<any>({ url: '/api/http/statusCode/404' }).catch((err) => {
	const e = err as RequestError
	// e.code === 'ERR_BAD_REQUEST'
	// e.statusCode === 404
	// e.response.statusCode === 404, e.response.data === the server's 404 response body
	// e.config.url === the full URL actually requested
})
```

## The errSubject Filtering Pattern

`errSubject` is always `'unix-request'`. When errors may come from multiple layers (a response interceptor replacing errors, multiple libraries mixed together, native callback pass-through), use it to filter by source:

```uts
import { REQUEST_ERR_SUBJECT } from '@/uni_modules/ux-request'

if (e.errSubject === REQUEST_ERR_SUBJECT) {
	// definitely an error thrown by this library
}
```

## Centralized Handling with Interceptors

A two-stage division of labor is the clearest: interceptors do **reporting and fallback for recoverable errors**, while the call site only handles business failures:

```uts
import { useResponseInterceptor } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

useResponseInterceptor(null, (err: RequestError): any | null => {
	report(err) // global reporting
	if (err.code == 'ERR_TIMEOUT') {
		return makeFallback() // you can also choose to recover: return a ResponseAny to turn it into success
	}
	return null // pass everything else to the business side's catch
})
```

- Need to turn specific errors "into success" → the interceptor recover path, see [Interceptors](./interceptors);
- Need finer native detail → read `nativeErrCode`; the classification mapping is in [Request Flow](./request-flow);
- Per-platform differences in timeout / network error behavior (e.g. an unroutable address on Web may classify as `ERR_NETWORK`) → see [Platform Compatibility](./compatibility).

For type definitions see the API docs [RequestError](../api/type-request-error) and [RequestErrorCode](../api/type-request-error-code).
