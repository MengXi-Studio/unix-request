# Cancellation

unix-request provides cancellation via `createCancelSource()` (same mental model as Axios's `CancelToken.source()`): cancellation is performed by the **library actively calling the native `task.abort()`**, so the semantics are 100% deterministic and do not rely on matching native errMsg patterns.

## Basic Usage

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

const source = createCancelSource()

request<any>({
	url: '/api/search/list',
	params: { keyword: 'mengxi' } as UTSJSONObject,
	cancelToken: source.token
}).then((res) => {
	console.log('ok')
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code)   // 'ERR_CANCELED'
	console.log(e.errMsg) // '请求已取消：页面卸载'
})

// at the moment you need to cancel (page unload, keyword change, etc.)
source.cancel('页面卸载')
```

- `source.token` goes onto `RequestConfig.cancelToken`;
- `source.cancel(reason)` cancels **all in-flight requests** associated with that token; `reason` is appended into `errMsg` (`'请求已取消：' + reason`; `'请求已取消'` when `null` is passed);
- Canceled requests reject with `ERR_CANCELED`.

## Pre-Send Cancellation vs In-Flight Cancellation

| Scenario | Behavior |
| --- | --- |
| Token **already canceled** when mounted (`cancel` first, request later) | Rejects `ERR_CANCELED` directly, **no network request is sent** |
| Canceled **in flight** | The library actively calls `task.abort()`; the fail is classified as `ERR_CANCELED` |

```uts
const pre = createCancelSource()
pre.cancel('发送前取消')
request<any>({ url: '/api/http/method/get', cancelToken: pre.token }).catch((err) => {
	const e = err as RequestError
	console.log(e.code) // ERR_CANCELED (no network request was sent at all)
})
```

## One Token Cancels Multiple Requests

A token can be mounted on multiple requests, and `cancel` cancels them all at once — perfect for "clear every in-flight request of this page on unload":

```uts
const source = createCancelSource()
request<any>({ url: '/api/a', cancelToken: source.token })
request<any>({ url: '/api/b', cancelToken: source.token })
request<any>({ url: '/api/c', cancelToken: source.token })

source.cancel('页面卸载') // all three requests receive ERR_CANCELED at the same time
```

## Tokens Are One-Shot

::: warning A Canceled Token Cannot Be Reused
After `cancel` the token is latched (`canceled === true`, with `reason` recording the cause); any later request mounted on that token is intercepted at the pre-send check and rejects with `ERR_CANCELED` directly. To send more requests after cancellation, **create a fresh `createCancelSource()`** (see the pattern in [FAQ](./faq)).
:::

Token state is readable:

```uts
const source = createCancelSource()
source.token.canceled // false
source.cancel('x')
source.token.canceled // true
source.token.reason   // 'x'
```

## Boundaries and Caveats

- **Always cancel through the cancelToken channel.** A fail caused by manually calling `abort()` on the native task obtained via `onTask` is classified as `ERR_NATIVE` (see [Request Config](./request-config));
- Token objects built by business code themselves (not via `createCancelSource`) only get the "pre-send cancellation check" and have no deterministic abort capability;
- Requests that have reached a terminal state (success / failure) are deregistered from the cancellation registry; `cancel` never accidentally hits completed requests;
- Cancellation and timeout are two independent paths: timeouts are classified as `ERR_TIMEOUT` (see [Error Handling](./error-handling)).

For API signatures see [createCancelSource()](../api/create-cancel-source) and the [CancelToken / CancelSource](../api/type-cancel) types.
