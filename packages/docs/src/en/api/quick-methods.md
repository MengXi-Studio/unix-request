# Shortcut Methods

The seven shortcut methods are method aliases of [request()](./request) (mirroring the axios method aliases), mounted on the default instance, with return values identical to `request()`: success resolves [ResponseResult](./type-response), failure rejects [RequestError](./type-request-error).

```uts
import { get } from '@/uni_modules/mx-request'

get<UTSJSONObject>('/api/users/1', null).then((res) => {
	console.log(res.data)
})
```

## Signatures at a Glance

| Method | Signature | Description |
| --- | --- | --- |
| `get` | `get<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | GET request |
| `post` | `post<T>(url: string, data: any \| null, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | POST request; `data` is the request body |
| `put` | `put<T>(url: string, data: any \| null, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | PUT request |
| `patch` | `patch<T>(url: string, data: any \| null, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | PATCH request |
| `del` | `del<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | DELETE request. `delete` is a UTS reserved word, hence the name `del` |
| `head` | `head<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | HEAD request |
| `options` | `options<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | OPTIONS request |

::: warning method is fixed by the method name
The `method` field in `config` is **not passed through** — the method is decided by the shortcut method name (`post()` always sends POST). This matches the axios semantics: the second/third parameters of the shortcut methods only provide request-level overrides (header, params, timeout, etc.), not the ability to change the method.
:::

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `url` | `string` | Request path. Relative paths are joined with baseURL; URLs starting with `http(s)` are used as-is |
| `data` | `any \| null` | Provided only by `post` / `put` / `patch`. The request body, passed through to the native adapter for serialization |
| `config` | [RequestQuickConfig](./type-request-quick-config) \| `null` | Request-level configuration (without the `url` field); may be `null` |

## Return Value

`Promise<ResponseResult<T>>`, structurally identical to [request()](./request): `T` only statically annotates the `data` type; failure rejects [RequestError](./type-request-error).

## Examples

### get / post

```uts
import { get, post } from '@/uni_modules/mx-request'

// GET: params go in config
get<Array<UTSJSONObject>>('/api/users', {
	params: { 'page': 1, 'size': 20 }
}).then((res) => {
	console.log(res.data.length)
})

// POST: data is the second parameter
post<UTSJSONObject>('/api/users', { 'name': 'MengXi' }, null).then((res) => {
	console.log(res.statusCode)
})
```

### put / patch / del

```uts
import { put, patch, del } from '@/uni_modules/mx-request'

put<UTSJSONObject>('/api/users/1', { 'name': 'new-name' }, null)
patch<UTSJSONObject>('/api/users/1', { 'remark': 'x' }, null)
del<UTSJSONObject>('/api/users/1', null)
```

### head / options

```uts
import { head, options } from '@/uni_modules/mx-request'

head<UTSJSONObject>('/api/health', null).then((res) => {
	console.log(res.statusCode, res.header)
})

options<UTSJSONObject>('/api/users', null)
```

## Related APIs

- [request()](./request)
- [RequestQuickConfig](./type-request-quick-config)
- [Request Instance](./request-instance) (same-named shortcut methods on the instance)
- [Params and Headers](../guide/params-and-headers)
