# Interceptor API

The default instance exposes three functions for interceptor registration and removal: `useRequestInterceptor` / `useResponseInterceptor` / `ejectInterceptor`. Interceptors can be registered multiple times, run in order, and are removable; v1 only supports synchronous callbacks. Instances have same-named methods (see [Request Instance](./request-instance)) with registries isolated per instance.

```uts
import { useRequestInterceptor } from '@/uni_modules/mx-request'

const id = useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['Authorization'] = 'Bearer <token>'
	}
	return config
})
```

## useRequestInterceptor(onFulfilled)

`(onFulfilled: (config: RequestConfig) => RequestConfig): number`

Registers a **request interceptor**. Before a request is sent, [RequestConfig](./type-request-config) is transformed layer by layer in registration order, with each layer's return value feeding the next layer:

| Parameter | Type | Description |
| --- | --- | --- |
| `onFulfilled` | `(config: RequestConfig) => RequestConfig` | Transforms and returns the config. **Must return the config**; the return value goes into the next interceptor layer |

Returns a `number` — the interceptor id, used to remove it via [ejectInterceptor](#ejectinterceptor-id).

## useResponseInterceptor(onFulfilled, onRejected)

```uts
useResponseInterceptor(
	onFulfilled: ((res: ResponseAny) => ResponseAny) | null,
	onRejected: ((err: RequestError) => any | null) | null
): number
```

Registers a **response interceptor**; both the success chain and the error chain run in registration order:

| Parameter | Type | Description |
| --- | --- | --- |
| `onFulfilled` | `((res: ResponseAny) => ResponseAny) \| null` | Success-path callback: transforms and returns the response; `null` means the success path is not handled |
| `onRejected` | `((err: RequestError) => any \| null) \| null` | Error-path callback, see the three paths below; `null` means the error path is not handled |

The return value of `onRejected` decides how the error proceeds (axios chain semantics):

| Return value | Meaning | What happens next |
| --- | --- | --- |
| `ResponseResult` | **Recover** | Switches to resolve; subsequent interceptors return to the success path |
| `RequestError` | **Swap the error** | Continues rejecting with the new error (error conversion) |
| `null` | **Pass through** | Continues rejecting with the original error |

::: warning Any exception thrown inside an interceptor is treated as a chain bug
The library catches it and converts it to `ERR_NATIVE` (working around UTS throw constraints that would break the chain). Express business branches through "return values" instead of throwing; recovery / error-swap detection relies on the `errSubject === 'unix-request'` contract ([RequestError](./type-request-error)), so use the library's error structure when swapping errors.
:::

## ejectInterceptor(id)

`(id: number): void`

Removes an interceptor by id (both the request and response registries are searched). The id is the return value of `useRequestInterceptor` / `useResponseInterceptor`; removing a non-existent id is a no-op.

## Return Value

Both registration functions return a `number` interceptor id (request/response share one auto-increment counter, unique across all instances).

## Examples

### Request interceptor injecting a token + response interceptor swapping errors

```uts
import { useRequestInterceptor, useResponseInterceptor, ejectInterceptor } from '@/uni_modules/mx-request'
import type { RequestError, ResponseAny } from '@/uni_modules/mx-request'

// Inject the auth header
const rid1 = useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['Authorization'] = 'Bearer ' + token()
	}
	return config
})

// Unified logout on 401 (error swap), pass everything else through
const rid2 = useResponseInterceptor(null, (err) => {
	if (err.code == 'ERR_BAD_REQUEST' && err.statusCode == 401) {
		logout()
	}
	return null
})

// Remove after logout
// ejectInterceptor(rid1)
// ejectInterceptor(rid2)
```

### Error recovery (fallback)

```uts
import { useResponseInterceptor } from '@/uni_modules/mx-request'
import type { RequestError, ResponseAny } from '@/uni_modules/mx-request'

useResponseInterceptor(null, (err): any | null => {
	if (err.code == 'ERR_NETWORK') {
		// Returning a ResponseResult recovers to resolve
		const fallback: ResponseAny = {
			data: { 'offline': true },
			statusCode: 599,
			header: {},
			cookies: [],
			config: err.config
		}
		return fallback
	}
	return null
})
```

## Related APIs

- [Request Instance](./request-instance) (instance-level interceptors)
- [RequestError](./type-request-error)
- [RequestConfig](./type-request-config)
- [Interceptors](../guide/interceptors) (implementation paths for retry / loading / business payload unwrapping, etc.)
