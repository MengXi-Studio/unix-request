# Request Config

A request's behavior is described by `RequestConfig` (the `request` main entry) or `RequestQuickConfig` (shortcut methods, no url field). Apart from url, their fields map one-to-one; this chapter covers them one by one.

## Field Overview

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` (required) | Request path. Relative paths are joined with baseURL; urls starting with `http://` / `https://` are used as-is |
| `method` | `RequestMethod \| null` | Request method; omitted or `null` uses the instance default (GET). This field has no effect in shortcut methods (the method is fixed by the method name) |
| `baseURL` | `string \| null` | Request-level override of the instance default baseURL |
| `params` | `UTSJSONObject \| null` | Query params, merged with the url's existing query and encoded uniformly in-library (see [Params & Headers](./params-and-headers)) |
| `data` | `any \| null` | Request body; for GET/HEAD a `UTSJSONObject` is automatically merged into the query |
| `header` | `UTSJSONObject \| null` | Request header, shallow-merged with the instance default header (request-level same-name keys override) |
| `timeout` | `number \| null` | Timeout in milliseconds; omitted or `null` uses the instance default (60000) |
| `dataType` | `string \| null` | Response dataType (`json` means the native layer JSON.parses), passed through natively |
| `responseType` | `string \| null` | Response data type, passed through natively (ArrayBuffer scenarios: app-android 4.51+ / app-ios 4.61+) |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | Status code validation; omitted or `null` uses the instance default (2xx counts as success) |
| `cancelToken` | `CancelToken \| null` | Cancel token; omitted or `null` means not cancelable (see [Cancellation](./cancel)) |
| `transformRequest` | `((data: any \| null) => any) \| null` | Request body transform; providing it replaces the built-in (see [Transforming Requests & Responses](./transform)) |
| `transformResponse` | `((data: any \| null) => any) \| null` | Response body transform; providing it replaces the built-in (the built-in is pass-through) |
| `onTask` | `((task: RequestTask) => void) \| null` | Escape hatch: get the native RequestTask (see below) |
| `enableQuic` / `sslVerify` / `withCredentials` / `firstIpv4` / `enableChunked` | `boolean \| null` | Native capability parameters, passed through fully without smoothing (see below) |

::: tip Optional fields are deliberate
Every field except `url` is optional. This is a hard-won rule for UTS plugins: the plugin proxy layer generates non-null casts for required fields, so a missed field means a null-pointer crash; all-optional + in-library null checks guarantee the call site can always write just `{ url: '/x' }`.
:::

## Nullable Semantics: Omitted or null Uses Instance Defaults

All optional fields share one consistent semantic: **omitted or explicitly `null` means the instance default applies** (falling back to the built-in defaults when the instance has none). Explicit `null` is equivalent to omitting, which keeps a uniform writing style in "dynamic configuration" scenarios:

```uts
import { request } from '@/uni_modules/ux-request'

request<any>({
	url: '/api/list',
	method: null,      // uses the instance default (GET)
	timeout: null      // uses the instance default (60000 or the configureRequest value)
})
```

## Three-Level Merging

The merge order is strictly: **built-in defaults → instance defaults (configureRequest / createRequest / setConfig) → request-level RequestConfig**.

| Config | Built-in default | Merge rule |
| --- | --- | --- |
| `method` | `GET` | A request-level value overrides |
| `timeout` | `60000` ms | A request-level value overrides |
| `validateStatus` | 2xx passes (`>= 200 && < 300`) | The callback overrides as a whole; no merging |
| `baseURL` | none (relative-path requests then fail-fast) | Request level overrides the instance default |
| `header` | none | **Shallow merge**: instance default keys are overridden by request-level same-name keys, other keys are kept |

```uts
import { request } from '@/uni_modules/ux-request'

// allow 3xx to count as success too (overrides the default 2xx validation)
request<any>({
	url: '/api/redirect-check',
	validateStatus: (statusCode: number): boolean => {
		return statusCode >= 200 && statusCode < 400
	}
})
```

> For the full semantics of `RequestDefaults` and instance defaults see [Instances & Global Defaults](./instances) and the API doc [RequestDefaults](../api/type-request-defaults).

## Native Pass-Through Parameters

The following fields are **passed through to `uni.request` in full; this library does not smooth them over**. Whether they take effect on each platform is subject to the [official documentation](https://doc.dcloud.net.cn/uni-app-x/api/request.html):

- `enableQuic`: QUIC transport
- `sslVerify`: SSL certificate verification
- `withCredentials`: cross-origin credentials
- `firstIpv4`: prefer IPv4
- `enableChunked`: chunked transfer (pair with `onTask` to listen for chunks)

Likewise, `dataType` / `responseType` are also passed through as-is. `responseType: 'arraybuffer'` has platform version differences (app-android 4.51+ / app-ios 4.61+); see [Platform Compatibility](./compatibility) for details.

## onTask: The Native Task Escape Hatch

`onTask` is called back with the native `RequestTask` after the request is sent, for advanced scenarios this library does not wrap (chunked listening, response header listening, etc.):

```uts
import { request } from '@/uni_modules/ux-request'

request<any>({
	url: '/api/stream',
	enableChunked: true,
	onTask: (task: RequestTask): void => {
		// native capabilities such as task.onChunkReceived / task.onHeadersReceived
	}
})
```

::: warning How manual aborts are classified
You can call `abort()` manually on the task obtained via `onTask`, but the resulting fail is classified as `ERR_NATIVE` (non-deterministic cancellation). **Always cancel through the [cancelToken](./cancel) channel** — its semantics are 100% deterministic.
:::

## Where Config Ends Up: The Send Snapshot

After normalization, the library holds a "send snapshot": url fully joined, params encoded and cleared, header merged. `response.config` / `error.config` hold exactly this — inspect it directly when debugging "what the request actually looked like". See [Request Flow](./request-flow) for the underlying principles.

For the full type definitions see the API docs [RequestConfig](../api/type-request-config) and [RequestQuickConfig](../api/type-request-quick-config).
