# RequestQuickConfig

The request-level configuration of the [shortcut methods](./quick-methods) (`get` / `post` / `put` / `patch` / `del` / `head` / `options`) and the instance shortcut methods, mirroring the `config` of `axios.get(url, config)`.

```uts
export type RequestQuickConfig = {
	/** Request method; omitted or null uses the instance default (GET) */
	method?: RequestMethod | null
	/** baseURL per-request override */
	baseURL?: string | null
	/** Query parameters: merged with the url's existing query, encoded and joined uniformly by the library */
	params?: UTSJSONObject | null
	/** Request body; a UTSJSONObject on GET/HEAD is automatically merged into the query */
	data?: any | null
	/** Request header; shallow-merged with the instance default header (request-level keys override same-name keys) */
	header?: UTSJSONObject | null
	/** Timeout in ms; omitted or null uses the instance default (60000) */
	timeout?: number | null
	/** Response dataType (json / other), passed through to the native adapter */
	dataType?: string | null
	/** Response data type, passed through natively (ArrayBuffer: app-android 4.51+ / app-ios 4.61+) */
	responseType?: string | null
	/** The native capability parameters below are passed through in full; this library does not normalize them — per-platform support depends on the official docs */
	enableQuic?: boolean | null
	sslVerify?: boolean | null
	withCredentials?: boolean | null
	firstIpv4?: boolean | null
	enableChunked?: boolean | null
	/** Status code check; omitted or null uses the instance default (2xx) */
	validateStatus?: ((statusCode: number) => boolean) | null
	/** Cancel token; omitted or null means not cancelable */
	cancelToken?: CancelToken | null
	/** Request body transform; providing one replaces the built-in behavior (data may be null, same as RequestConfig) */
	transformRequest?: ((data: any | null) => any) | null
	/** Response body transform; providing one replaces the built-in (built-in = pass through as-is; nullable parameter as above) */
	transformResponse?: ((data: any | null) => any) | null
	/** Escape hatch: access the native RequestTask (chunked listening and other advanced scenarios) */
	onTask?: ((task: RequestTask) => void) | null
}
```

::: tip Why there is no url field
`url` is provided by the first parameter of the shortcut methods and is deliberately omitted from the type, so callers don't have to pass a placeholder just to satisfy the required [RequestConfig](./type-request-config).url. Apart from `url`, the fields map one-to-one to `RequestConfig` with exactly the same semantics.
:::

::: warning The method field is not passed through
A shortcut method's method is **fixed by its name** (`post()` always sends POST); `config.method` does not participate in merging — the field is kept only for structural alignment with `RequestConfig`. Do not rely on it to change the request method.
:::

## Fields

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `method` | `RequestMethod \| null` | (not passed through) | Decided by the shortcut method name; see the warning above |
| `baseURL` | `string \| null` | Instance default | Per-request override of the global baseURL |
| `params` | `UTSJSONObject \| null` | — | Query parameters, deterministically encoded into the url by the library |
| `data` | `any \| null` | — | Request-level data; shares the same slot as the method's `data` parameter, which **takes precedence** (on POST/PUT/PATCH the method parameter overrides this field when merging) |
| `header` | `UTSJSONObject \| null` | Instance default header | Shallow-merged; request-level keys override same-name keys |
| `timeout` | `number \| null` | Instance default (`60000`) | Timeout in ms |
| `dataType` | `string \| null` | Native default (`json`) | Passed through natively |
| `responseType` | `string \| null` | — | Passed through natively |
| `enableQuic` | `boolean \| null` | Native default | Native capability parameter, passed through in full |
| `sslVerify` | `boolean \| null` | Native default | Same as above |
| `withCredentials` | `boolean \| null` | Native default | Same as above |
| `firstIpv4` | `boolean \| null` | Native default | Same as above |
| `enableChunked` | `boolean \| null` | Native default | Same as above |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | Instance default (2xx) | Overridden as a whole |
| `cancelToken` | `CancelToken \| null` | `null` | Passing one enables cancellation; see [createCancelSource()](./create-cancel-source) |
| `transformRequest` | `((data: any \| null) => any) \| null` | Built-in behavior | Providing one replaces the built-in |
| `transformResponse` | `((data: any \| null) => any) \| null` | Built-in behavior | Providing one replaces the built-in |
| `onTask` | `((task: RequestTask) => void) \| null` | — | Native RequestTask escape hatch |

## Companion Methods

- Top-level shortcut methods (default instance): [Shortcut Methods](./quick-methods)
- Instance shortcut methods: [Request Instance](./request-instance)

## Examples

```uts
import { get } from '@/uni_modules/ux-request'

const header: UTSJSONObject = {}
header['Accept-Language'] = 'zh-CN'

get<Array<UTSJSONObject>>('/api/users', {
	params: { 'page': 1 },
	header: header,
	timeout: 10000
}).then((res) => {
	console.log(res.data.length)
})
```

## Related APIs

- [RequestConfig](./type-request-config)
- [Shortcut Methods](./quick-methods)
- [RequestDefaults](./type-request-defaults)
