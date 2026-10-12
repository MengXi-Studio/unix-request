# Transforming Requests & Responses

`transformRequest` / `transformResponse` are request-level transform hooks (mirroring the same-named Axios config): **providing one replaces the built-in behavior**; otherwise the built-in default applies.

## Built-in Behavior Overview

| Scenario | Built-in behavior |
| --- | --- |
| `transformRequest` not provided | data passes through to the native layer as-is (serialization is handled by the native adapter); when data is a `UTSJSONObject` and `content-type` is not explicitly set, `application/json` is set |
| `transformRequest` provided | The business transform runs, replacing the built-in; if the result is a `UTSJSONObject`, the Content-Type default applies to it as well |
| `transformResponse` not provided | The response body is **passed through as-is** (JSON parsing is done by the native `dataType: 'json'`) |
| `transformResponse` provided | The business transform runs, replacing the built-in pass-through |

::: tip Serialization Is Not Reinvented
Request body serialization (JSON.stringify etc.) relies entirely on the native adapter; the library does not reinvent it. The only thing the library proactively does is set the Content-Type: guaranteeing a `UTSJSONObject` request body is sent as `application/json` by default; a business-set `content-type` (case-insensitively detected) is never overridden. For `string` / `ArrayBuffer` request bodies the Content-Type is up to you.
:::

## transformRequest

Providing it replaces the built-in — good for uniformly massaging request bodies (adding timestamps, reshaping, etc.):

```uts
import { post } from '@/uni_modules/ux-request'

post<any>('/api/user/create', { name: 'mengxi' } as UTSJSONObject, {
	transformRequest: (data: any | null): any => {
		if (data == null) {
			return data
		}
		// example: add a timestamp to every UTSJSONObject request body
		if (data instanceof UTSJSONObject) {
			const obj = data as UTSJSONObject
			obj['_ts'] = Date.now()
			return obj
		}
		return data
	}
})
```

::: warning The Parameter Must Be Nullable, and Is Always null for GET/HEAD
The callback signature is `(data: any | null) => any`; the parameter type **must be written `any | null`** (writing `any` fails to compile on the Kotlin side due to function parameter contravariance).

For GET/HEAD requests, data has already been merged into the query during normalization, so **the data `transformRequest` receives is always `null`** — always null-check inside the transform, otherwise your custom logic will misfire on GET requests:

```uts
transformRequest: (data: any | null): any => {
	if (data == null) {
		return data
	}
	// only handle non-empty request bodies
	return data
}
```
:::

## transformResponse

The built-in is pass-through; providing it replaces that. A typical use is "business unwrapping" — say the server uniformly returns `{ code, msg, result }`:

```uts
import { request } from '@/uni_modules/ux-request'

request<any>({
	url: '/api/user/1',
	transformResponse: (data: any | null): any => {
		if (data instanceof UTSJSONObject) {
			const obj = data as UTSJSONObject
			return obj['result'] ?? obj
		}
		return data
	}
}).then((res) => {
	// res.data is now the unwrapped result
})
```

Two behavioral boundaries:

- `transformResponse` runs **after** `validateStatus`: HTTP errors (4xx / 5xx) reject directly and never reach transformResponse;
- Exceptions thrown inside the transform are caught by the library and turned into `ERR_NATIVE` (errMsg 「transformResponse 执行异常」), never causing an uncaught crash; `transformRequest` exceptions behave the same.

## transform vs. Interceptors: Division of Labor

| Concern | Use transform | Use interceptors |
| --- | --- | --- |
| Shaping the **data form** of the request body / response body | ✅ | — |
| Header injection, URL rewriting | — | ✅ |
| Needs to read the whole config (header / url) | — | ✅ |
| Error recovery / replacing the error / pass-through | — | ✅ |

transform only handles "data", and is a one-off request-level config; logic that cuts across all requests belongs in [Interceptors](./interceptors).
