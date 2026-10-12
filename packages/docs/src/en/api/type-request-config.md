# RequestConfig

The request configuration type of [request()](./request) and the instance `request(config)`, mirroring the axios config. `url` is required; all other fields are optional.

```uts
export type RequestConfig = {
	/** Request path; relative paths are joined with baseURL (instance default < request-level override), URLs starting with http(s) are used as-is */
	url: string
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
	/** Request body transform; providing one replaces the built-in behavior (data may be null: always null on GET/HEAD after normalization) */
	transformRequest?: ((data: any | null) => any) | null
	/** Response body transform; providing one replaces the built-in (built-in = pass through as-is) */
	transformResponse?: ((data: any | null) => any) | null
	/** Escape hatch: access the native RequestTask (chunked listening and other advanced scenarios) */
	onTask?: ((task: RequestTask) => void) | null
}
```

::: warning "Everything except url is optional" is a deliberate null-safety design
The uts-proxy layer generates non-null coercions for **required fields** — a business-side omission means an NPE on the native side; only **optional fields** get null-safe encoding. That is why this type deliberately keeps `url` as its only required field and marks everything else `?` + `| null` — the implementation uniformly checks nullable values and falls back (three-level merge down to instance defaults → built-in defaults). The business side needs no defensive code for "missing fields".
:::

## Fields

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | — | **Required**. Relative paths are joined with baseURL (double slashes tolerated on either side); URLs starting with `http(s)` are used as-is |
| `method` | `RequestMethod` | `'GET'` | Same as the entry constant `DEFAULT_METHOD`; `RequestDefaults` has no method field, so the instance default is the built-in default |
| `baseURL` | `string \| null` | Instance default | Per-request override of the global baseURL; no baseURL and a relative url → `ERR_CONFIG` |
| `params` | `UTSJSONObject \| null` | — | Query parameters: merged with the url's existing query, deterministically encoded by the library (`encodeURIComponent` on keys and values) |
| `data` | `any \| null` | — | Request body; a UTSJSONObject on GET/HEAD is automatically merged into the query and no longer passed to the native layer |
| `header` | `UTSJSONObject \| null` | Instance default header | Shallow-merged with the instance default header; request-level keys override same-name keys |
| `timeout` | `number \| null` | Instance default (`60000`) | Entry constant `DEFAULT_TIMEOUT = 60000`; overridden whenever the request level provides a value |
| `dataType` | `string \| null` | Native default (`json`) | With `json`, the native layer JSON-parses the returned data; passed through natively |
| `responseType` | `string \| null` | — | Response data type (ArrayBuffer: app-android 4.51+ / app-ios 4.61+), passed through natively |
| `enableQuic` | `boolean \| null` | Native default | Native capability parameter, passed through in full without normalization; per-platform support depends on the official docs |
| `sslVerify` | `boolean \| null` | Native default | Same as above |
| `withCredentials` | `boolean \| null` | Native default | Same as above |
| `firstIpv4` | `boolean \| null` | Native default | Same as above |
| `enableChunked` | `boolean \| null` | Native default | Same as above (combined with `onTask` for chunk listening) |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | Instance default (2xx) | Overridden as a whole whenever the request level provides a value; on failure 4xx → `ERR_BAD_REQUEST` / 5xx → `ERR_BAD_RESPONSE` |
| `cancelToken` | `CancelToken \| null` | `null` | Passing one enables cancellation; see [createCancelSource()](./create-cancel-source) |
| `transformRequest` | `((data: any \| null) => any) \| null` | Built-in behavior | Providing one replaces the built-in (built-in = sets `application/json` when data is a UTSJSONObject and content-type is not explicitly set) |
| `transformResponse` | `((data: any \| null) => any) \| null` | Built-in behavior | Providing one replaces the built-in (built-in = pass through as-is) |
| `onTask` | `((task: RequestTask) => void) \| null` | — | Escape hatch: access the native RequestTask; does not affect the library's cancellation registration |

## Merge Precedence

Request-level fields merge with instance defaults in three levels (**built-in defaults < instance defaults < request-level RequestConfig**): scalar fields (method / timeout) are overridden whenever the request level provides a value; `header` is shallow-merged; callback fields (validateStatus / transform / cancelToken) are overridden as a whole whenever the request level provides a value. See [Request Configuration](../guide/request-config) for details.

::: tip transformRequest and GET/HEAD
For GET/HEAD the data is merged into the query during normalization, so the `data` received by `transformRequest` is always `null` (an M4 Kotlin null-safety constraint; the signature parameter is nullable) — check for null inside custom transforms.
:::

## Related APIs

- [RequestQuickConfig](./type-request-quick-config) (the url-less version for the shortcut methods)
- [RequestDefaults](./type-request-defaults)
- [CancelToken / CancelSource](./type-cancel)
- [RequestConfig Options](../guide/request-config)
