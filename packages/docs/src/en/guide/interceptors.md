# Interceptors

Interceptors are unix-request's core capability mirroring Axios: process config uniformly before a request is sent, and process the result or error uniformly after the response comes back. The default instance and `createRequest` instances each own an independent interceptor registry.

## Registering and Removing

```uts
import { useRequestInterceptor, useResponseInterceptor, ejectInterceptor } from '@/uni_modules/ux-request'

const reqId = useRequestInterceptor((config) => {
	// request interception
	return config
})
const resId = useResponseInterceptor((res) => {
	// response success path
	return res
}, null) // the second argument is the error path; pass null as a placeholder

ejectInterceptor(reqId) // remove by id
ejectInterceptor(resId)
```

Rules:

- Registration returns an **auto-incrementing id** (request / response share one counter); `ejectInterceptor(id)` removes by id;
- Multiple interceptors execute in **registration order**;
- `useResponseInterceptor` takes two arguments: `onFulfilled` (the success path; `null` may be passed as a placeholder) and `onRejected` (the error path; `null` allowed);
- The registry hangs off the instance: interceptors on the default instance do not affect instances created by `createRequest`, and vice versa.

For API signatures see the [Interceptor API](../api/interceptors).

## Request Interceptors

`onFulfilled` receives the config and **must return the rewritten config**; each return value is passed to the next interceptor:

```uts
useRequestInterceptor((config) => {
	const h = config.header
	if (h == null) {
		const fresh: UTSJSONObject = {}
		fresh['Authorization'] = 'Bearer token'
		config.header = fresh
	} else {
		h['Authorization'] = 'Bearer token'
	}
	return config
})
```

::: warning What You Get Is the "Normalized" Config
Request interceptors run **after** config normalization, so at this point:

- `config.url` is already the **full address** with baseURL joined;
- `config.params` has been cleared (encoded into the url);
- `config.data` of GET/HEAD requests is always `null` (already merged into the query).

Rewriting `params` will not be encoded into the url anymore — to append a query, modify `config.url` directly. For the full pipeline see [Request Flow](./request-flow).
:::

## Response Interceptors: The Success Path

`onFulfilled` receives `ResponseAny`, and its return value keeps flowing downstream (useful for unified logging, unwrapping, field normalization):

```uts
useResponseInterceptor((res) => {
	let url = 'config-null'
	const cfg = res.config
	if (cfg != null) {
		url = cfg.url
	}
	console.log('[res] ' + res.statusCode.toString() + ' ' + url)
	return res // always return the response, otherwise the chain gets no result
}, null)
```

## Response Interceptors: Three Paths in the Error Chain

`onRejected` receives the unified error [RequestError](../api/type-request-error); the return value decides one of three paths (Axios-identical semantics):

| Return value | Behavior |
| --- | --- |
| `ResponseResult` (a response object) | **Recover**: switch to resolve; subsequent interceptors return to the success state |
| `RequestError` (an error object) | **Replace the error**: keep rejecting with the new error |
| `null` | **Pass through**: keep rejecting to the caller with the original error |

::: warning UTS Writing Constraint
The return type of a page-side `onRejected` callback must be declared explicitly as `any | null` (an object union type gets transpiled by HBuilderX into a no-return expectation, and `return` becomes a compile error):

```uts
useResponseInterceptor(null, (err: RequestError): any | null => {
	// ...
	return null
})
```
:::

### Path 1: Recover (Turn an Error into a Fallback Success)

```uts
import type { RequestError, ResponseAny } from '@/uni_modules/ux-request'

const recId = useResponseInterceptor(null, (err: RequestError): any | null => {
	if (err.code == 'ERR_BAD_REQUEST') {
		// build a fallback response: header must be an empty object, not null
		const emptyHeader: UTSJSONObject = {}
		const fallback: ResponseAny = {
			data: 'recovered-from-404',
			statusCode: 599,
			header: emptyHeader,
			cookies: [] as Array<string>,
			config: err.config
		}
		return fallback // the caller's then receives it normally, res.data === 'recovered-from-404'
	}
	return null // pass through all other errors
})
```

### Path 2: Replace the Error

```uts
import type { RequestError } from '@/uni_modules/ux-request'

const mapId = useResponseInterceptor(null, (err: RequestError): any | null => {
	const converted: RequestError = {
		code: 'ERR_CANCELED',
		errSubject: 'unix-request',
		errMsg: '业务转换后的错误',
		nativeErrCode: null,
		statusCode: null,
		config: err.config,
		response: null
	}
	return converted // the caller's catch receives converted
})
```

### Path 3: Pass Through

```uts
useResponseInterceptor(null, (err: RequestError): any | null => {
	report(err) // custom reporting, then pass through; the caller catches as usual
	return null
})
```

::: tip How the Three Paths Are Distinguished
The library uses the `errSubject === 'unix-request'` contract value to tell whether a return value is an error or a response (the constant `REQUEST_ERR_SUBJECT`). So **keep the RequestError structurally complete when replacing errors** (keep errSubject as `'unix-request'`); when building a response object on the recover path, remember `header` must be an empty object, not `null`.
:::

## Not Only Network Errors Enter the Error Chain

Following Axios semantics, these **upstream errors** also enter the response interceptor's `onRejected`:

- Config normalization failure (`ERR_PARAM` / `ERR_CONFIG`; `err.config` then holds the original request-level config);
- Exceptions thrown by request interceptors (caught in-library and turned into `ERR_NATIVE`);
- Exceptions thrown by `transformRequest` (`ERR_NATIVE`);
- Pre-send cancellation (the token was already canceled, `ERR_CANCELED`).

So "global error reporting" only needs one `onRejected` registration to cover failures across the entire request lifecycle. Conversely, any exception thrown inside an interceptor is caught by the library and turned into `ERR_NATIVE`, never breaking the chain.

## Practical Recipe: Unified Token Injection + Unified Error Reporting

```uts
import { useRequestInterceptor, useResponseInterceptor } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['token'] = getToken() // implemented on the business side
	}
	return config
})

useResponseInterceptor(null, (err: RequestError): any | null => {
	reportToServer(err.code, err.errMsg) // implemented on the business side
	return null // pass through to the business side's catch
})
```

More ideas (seamless token refresh, loading counters) follow the same pattern: inject in the request interceptor, combine recover / pass through in `onRejected`.
