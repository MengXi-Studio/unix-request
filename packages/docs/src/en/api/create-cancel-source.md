# createCancelSource()

`createCancelSource(): CancelSource` creates a cancel source (same mental model as axios `CancelToken.source()`): attach the `token` to the `cancelToken` field of [RequestConfig](./type-request-config), then call `cancel(reason)` to cancel all in-flight requests associated with that token.

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

const source = createCancelSource()

request<UTSJSONObject>({ url: '/api/heavy-report', cancelToken: source.token }).catch((err) => {
	const e = err as RequestError
	console.log(e.code) // ERR_CANCELED
})

// Cancel when the page unloads
source.cancel('page unloaded')
```

## Return Value

Returns a [CancelSource](./type-cancel):

| Field | Type | Description |
| --- | --- | --- |
| `token` | [CancelToken](./type-cancel) | The cancel token, attached to `RequestConfig.cancelToken` |
| `cancel` | `(reason: string \| null) => void` | Cancels all in-flight requests associated with the token; `reason` is recorded in `token.reason` and reflected in the error message |

## Cancellation Semantics

Cancellation is implemented deterministically inside the library (actively calling `task.abort()`), not by pattern-matching native errMsg traits:

- **Canceled before send**: the request rejects with `ERR_CANCELED` immediately, **no network call**;
- **Canceled in flight**: the in-flight task is aborted; after the native fail, the error is classified as `ERR_CANCELED` based on the `token.canceled` flag;
- **One token, multiple requests**: `cancel()` cancels all of them at once;
- **Repeated `cancel()`**: idempotent; calls after the first are no-ops;
- The cancel error message carries the reason: `errMsg` reads `请求已取消：页面卸载` ("request canceled: page unloaded"; just `请求已取消` when there is no reason).

::: warning Self-built tokens only get the pre-send check
`CancelToken` is a plain object type, so business code can build `{ canceled: true, reason: null }` itself, but such tokens are not in the library's registry — they only get the "intercept if canceled before send" behavior; the in-flight abort requires a token created via `createCancelSource()`.
:::

## Examples

### Canceled before send + canceled in flight

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

// Case 1: canceled before send → no network call, rejects ERR_CANCELED immediately
const pre = createCancelSource()
pre.cancel('cancel before send')
request<UTSJSONObject>({ url: '/api/list', cancelToken: pre.token }).then((res) => {
	// never reaches here
}).catch((err) => {
	console.log((err as RequestError).code) // ERR_CANCELED
})

// Case 2: canceled in flight → aborts the in-flight request
const fly = createCancelSource()
request<UTSJSONObject>({ url: '/api/list', cancelToken: fly.token }).catch((err) => {
	console.log((err as RequestError).code) // ERR_CANCELED
})
setTimeout(() => {
	fly.cancel('page unloaded')
}, 100)
```

### Race protection (keep only the latest search)

```uts
import { get, createCancelSource } from '@/uni_modules/mx-request'

let searchSource = createCancelSource()

function onSearchInput(keyword: string): void {
	searchSource.cancel('new search')
	searchSource = createCancelSource()
	get<UTSJSONObject>('/api/search', { params: { 'q': keyword }, cancelToken: searchSource.token }).then((res) => {
		render(res.data)
	}).catch(() => {
		// canceled old requests fail silently here
	})
}
```

## Related APIs

- [CancelToken / CancelSource](./type-cancel)
- [RequestConfig](./type-request-config) (the `cancelToken` field)
- [RequestErrorCode](./type-request-error-code) (`ERR_CANCELED`)
- [Canceling Requests](../guide/cancel)
