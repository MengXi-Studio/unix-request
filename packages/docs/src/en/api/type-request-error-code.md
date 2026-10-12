# RequestErrorCode

Unified error codes, a `string` literal union (mirroring the AxiosError code system; native errCode values are passed through as-is, unmapped, via [RequestError](./type-request-error)'s `nativeErrCode`).

```uts
export type RequestErrorCode =
	| 'ERR_PARAM' // invalid parameters (empty url, etc.)
	| 'ERR_CONFIG' // invalid configuration (relative path without a baseURL, etc.)
	| 'ERR_CANCELED' // actively canceled (cancelToken)
	| 'ERR_TIMEOUT' // timeout (native errCode 5 classified here)
	| 'ERR_NETWORK' // network error (native 600003 and other network-class errors classified here)
	| 'ERR_BAD_REQUEST' // HTTP 4xx (validateStatus failed and statusCode < 500)
	| 'ERR_BAD_RESPONSE' // HTTP 5xx (validateStatus failed and statusCode >= 500)
	| 'ERR_NATIVE' // other native failures
```

## Error Code Details

| code | Trigger | Network call | `nativeErrCode` | `statusCode` | `response` |
| --- | --- | --- | --- | --- | --- |
| `ERR_PARAM` | Invalid parameters: empty `url` string, etc.; fails fast before sending | No | `null` | `null` | `null` |
| `ERR_CONFIG` | Invalid configuration: relative-path request without a baseURL (including the global default); fails fast before sending | No | `null` | `null` | `null` |
| `ERR_CANCELED` | Active cancellation: the [cancelToken](./type-cancel) was already canceled before sending, or aborted in flight by `cancel()` | Depends on timing | `null` | `null` | `null` |
| `ERR_TIMEOUT` | Request timeout (native fail errCode `5` classified here) | Yes | `5` | `null` | `null` |
| `ERR_NETWORK` | Network error (native errCode `600003` network interruption / `600010` Cronet module load failure and other network-class errors classified here) | Yes | original value | `null` | `null` |
| `ERR_BAD_REQUEST` | HTTP 4xx: the response arrived but `validateStatus` (default 2xx) failed and `statusCode < 500` | Yes | `null` | the 4xx value | raw response attached |
| `ERR_BAD_RESPONSE` | HTTP 5xx: the response arrived but `validateStatus` failed and `statusCode >= 500` | Yes | `null` | the 5xx value | raw response attached |
| `ERR_NATIVE` | Other native failures (`1000` / `100001–100003` / `600008` / `600009` / `602001`, etc., with `nativeErrCode` passed through as-is); plus exceptions thrown by interceptors / transforms (`nativeErrCode` is `null`) | Varies | original value or `null` | `null` | `null` |

## Classification Rules

Deterministic mapping, no ambiguous branches:

1. **Pre-send** (parameter / configuration checks, cancellation pre-check) → `ERR_PARAM` / `ERR_CONFIG` / `ERR_CANCELED`, no network call;
2. **Native fail** → classified by the native errCode: `5` → `ERR_TIMEOUT`, `600003` / `600010` → `ERR_NETWORK`, everything else → `ERR_NATIVE`; cancellation semantics take precedence (an already-canceled token is always `ERR_CANCELED`);
3. **Response arrived but validation failed** → 4xx `ERR_BAD_REQUEST` / 5xx `ERR_BAD_RESPONSE`, with `response` carrying the raw response.

::: tip Relation to native errCode
The library's `code` is the stable basis for business branching; `nativeErrCode` keeps the original native value for investigating low-level details. Look at both together: `e.code === 'ERR_TIMEOUT' && e.nativeErrCode === 5`.
:::

## Examples

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<UTSJSONObject>({ url: '/api/data' }).catch((err) => {
	const e = err as RequestError
	switch (e.code) {
		case 'ERR_CANCELED':
			// canceled; just stay silent
			break
		case 'ERR_TIMEOUT':
			console.log('timeout, native errCode=' + e.nativeErrCode)
			break
		case 'ERR_BAD_REQUEST':
		case 'ERR_BAD_RESPONSE':
			console.log('HTTP ' + e.statusCode + ', body=' + (e.response?.data ?? ''))
			break
		default:
			console.log(e.errMsg)
	}
})
```

## Related APIs

- [RequestError](./type-request-error)
- [CancelToken / CancelSource](./type-cancel) (the source of `ERR_CANCELED`)
- [Error Handling](../guide/error-handling)
