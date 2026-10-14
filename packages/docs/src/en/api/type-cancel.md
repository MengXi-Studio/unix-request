# CancelToken / CancelSource

The two types for canceling requests, created by [createCancelSource()](./create-cancel-source) (same mental model as axios `CancelToken.source()`): attach the `token` to the `cancelToken` field of [RequestConfig](./type-request-config), then `cancel(reason)` cancels the associated requests.

```uts
/** Cancel token */
export type CancelToken = {
	/** Whether already canceled */
	canceled: boolean
	/** Cancellation reason; null when not canceled */
	reason: string | null
}

/** Cancel source (returned by createCancelSource, same mental model as axios CancelToken.source()) */
export type CancelSource = {
	/** Associated token (attach to RequestConfig.cancelToken) */
	token: CancelToken
	/** Cancels all in-flight requests associated with the token */
	cancel: (reason: string | null) => void
}
```

## CancelToken Fields

| Name | Type | Description |
| --- | --- | --- |
| `canceled` | `boolean` | Whether already canceled. Set to `true` after `cancel()`; from then on, new requests associated with the token are intercepted before sending |
| `reason` | `string \| null` | Cancellation reason; `null` when not canceled. Reflected in the `ERR_CANCELED` `errMsg` (`请求已取消：<reason>`, i.e. "request canceled: `<reason>`") |

## CancelSource Fields

| Name | Type | Description |
| --- | --- | --- |
| `token` | `CancelToken` | The cancel token, attached to `RequestConfig.cancelToken` |
| `cancel` | `(reason: string \| null) => void` | Cancels **all** in-flight requests associated with the token (deterministic `abort()` inside the library); repeated calls are idempotent |

::: warning Capability boundary of self-built tokens
`CancelToken` is a plain object type, so business code can build `{ canceled: true, reason: 'x' }` itself — but such tokens are not in the library's registry and **only get the pre-send check** (already canceled → `ERR_CANCELED` without a network call); the deterministic in-flight abort requires a token created via `createCancelSource()`.
:::

## Examples

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

const source = createCancelSource()

request<UTSJSONObject>({ url: '/api/heavy', cancelToken: source.token }).then((res) => {
	console.log(res.statusCode)
}).catch((err) => {
	const e = err as RequestError
	if (e.code == 'ERR_CANCELED') {
		console.log(source.token.canceled) // true
		console.log(source.token.reason)   // 'page unloaded'
	}
})

setTimeout(() => {
	source.cancel('page unloaded')
}, 100)
```

## Related APIs

- [createCancelSource()](./create-cancel-source)
- [RequestConfig](./type-request-config) (the `cancelToken` field)
- [RequestErrorCode](./type-request-error-code) (`ERR_CANCELED`)
- [Canceling Requests](../guide/cancel)
