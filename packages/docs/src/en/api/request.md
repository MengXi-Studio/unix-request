# request()

`request<T>(config: RequestConfig): Promise<ResponseResult<T>>` fires a single HTTP request and is the main entry point of the library (mounted on the default instance). Success resolves with the unified response structure [ResponseResult](./type-response), failure rejects with the unified error structure [RequestError](./type-request-error) — the caller only has to deal with a single Promise.

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<{ id: number, name: string }>({
	url: '/api/users/1',
	method: 'GET'
}).then((res) => {
	console.log(res.statusCode, res.data.name)
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code, e.errMsg)
})
```

## Parameters

`request<T>(config: RequestConfig)`

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | [RequestConfig](./type-request-config) | Yes | Request configuration. `url` is required, all other fields are optional (full fields and merge rules in [RequestConfig](./type-request-config)) |

Common fields at a glance:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | — | **Required**. Relative paths are joined with baseURL; URLs starting with `http(s)` are used as-is |
| `method` | `RequestMethod` | `'GET'` | Same as the entry constant `DEFAULT_METHOD` |
| `baseURL` | `string \| null` | Instance default | Per-request override of the global baseURL |
| `params` | `UTSJSONObject \| null` | — | Query parameters, deterministically encoded into the url by the library |
| `data` | `any \| null` | — | Request body; a UTSJSONObject on GET/HEAD is automatically merged into the query |
| `header` | `UTSJSONObject \| null` | — | Shallow-merged with the instance default header; request-level keys override same-name keys |
| `timeout` | `number \| null` | `60000` | Same as the entry constant `DEFAULT_TIMEOUT` |
| `validateStatus` | `(statusCode: number) => boolean \| null` | 2xx check | When it fails, errors are classified as 4xx / 5xx |
| `cancelToken` | `CancelToken \| null` | `null` | Passing one enables cancellation; see [createCancelSource()](./create-cancel-source) |

## Return Value

`Promise<ResponseResult<T>>`:

- On success resolves [ResponseResult](./type-response); `data` is the generic `T` (a consumer-side static annotation only — the value actually flows as `any`, cast as needed on the business side);
- A native empty response body (e.g. HEAD, 204) is normalized to an empty object, keeping the `data` contract non-null.

## Errors

Failure rejects [RequestError](./type-request-error); error codes are listed in [RequestErrorCode](./type-request-error-code). Typical paths:

- **Pre-send fail-fast (no network call)**: empty `url` → `ERR_PARAM`; relative path without baseURL → `ERR_CONFIG`; token already canceled → `ERR_CANCELED`;
- **HTTP layer**: when `validateStatus` (default 2xx) fails, 4xx → `ERR_BAD_REQUEST`, 5xx → `ERR_BAD_RESPONSE`, with `error.response` carrying the raw response (including the body);
- **Network layer**: timeout → `ERR_TIMEOUT` (`nativeErrCode` passes through `5`), network interruption → `ERR_NETWORK`, other native failures → `ERR_NATIVE`.

::: tip Interceptors
Before sending, the config passes through the request interceptor chain, and the response passes through the response interceptor chain (both on the default instance's registry). For full interceptor semantics see [Interceptor API](./interceptors) and the [Interceptors guide](../guide/interceptors).
:::

## Examples

### Success (POST + params + header)

```uts
import { request } from '@/uni_modules/ux-request'

const header: UTSJSONObject = {}
header['Authorization'] = 'Bearer <token>'

request<UTSJSONObject>({
	url: '/api/users',
	method: 'POST',
	params: { 'lang': 'zh-CN' },
	data: { 'name': 'MengXi' },
	header: header,
	timeout: 15000
}).then((res) => {
	console.log('statusCode=' + res.statusCode)
})
```

### Failure (HTTP 4xx with the raw response)

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<UTSJSONObject>({ url: '/api/missing' }).then((res) => {
	// 4xx does not reach here by default (validateStatus failed)
}).catch((err) => {
	const e = err as RequestError
	// e.code === 'ERR_BAD_REQUEST', e.statusCode === 404
	// e.response?.data holds the error body returned by the server
	console.log(e.code, e.errMsg)
})
```

## Related APIs

- [Shortcut Methods](./quick-methods)
- [RequestConfig](./type-request-config)
- [ResponseResult](./type-response)
- [RequestError](./type-request-error)
- [Making Requests](../guide/requests)
