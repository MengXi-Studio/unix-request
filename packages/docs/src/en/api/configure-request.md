# configureRequest()

`configureRequest(defaults: RequestDefaults): void` configures the global defaults of the **default instance** (baseURL / timeout / header / validateStatus). In an App it is usually called once at startup.

```uts
import { configureRequest } from '@/uni_modules/ux-request'

const header: UTSJSONObject = {}
header['x-app'] = 'demo'

configureRequest({
	baseURL: 'https://api.example.com',
	timeout: 15000,
	header: header,
	validateStatus: null
})
```

::: warning Only affects the default instance
`configureRequest` writes the defaults of the default instance (top-level APIs such as [request()](./request)). Instances created by `createRequest()` are unaffected — they use `instance.setConfig` to change their own defaults; see [Request Instance](./request-instance).
:::

## Parameters

`configureRequest(defaults: RequestDefaults)`

| Parameter | Type | Description |
| --- | --- | --- |
| `defaults` | [RequestDefaults](./type-request-defaults) | Global default configuration; all four fields must be present positionally and may be `null` |

**Meaning of `null` fields**: a `null` field means the built-in default applies —

| Field | Built-in default when `null` |
| --- | --- |
| `baseURL` | None (relative-path requests fail fast with `ERR_CONFIG`) |
| `timeout` | `60000` (entry constant `DEFAULT_TIMEOUT`) |
| `header` | Empty (no default header attached) |
| `validateStatus` | 2xx check (`statusCode >= 200 && statusCode < 300`) |

::: tip Merge precedence
The effective order is a three-level merge: **built-in defaults < `configureRequest` defaults < request-level RequestConfig**. Scalar fields are overridden whenever the request level provides a value; `header` is shallow-merged (request-level keys override default keys by the same name); `validateStatus` is overridden as a whole, not merged. See [RequestConfig](./type-request-config) and [Request Configuration](../guide/request-config) for details.
:::

## Return Value

`void`. Changes take effect immediately for subsequent requests and do not affect requests already in flight.

## Examples

Configuring the global baseURL and default header in `onLaunch` of App.uvue:

```uts
// App.uvue
import { configureRequest } from '@/uni_modules/ux-request'

export class App implements IApp {
	onLaunch(): void {
		const header: UTSJSONObject = {}
		header['x-client'] = 'uni-app-x'
		configureRequest({
			baseURL: 'https://api.example.com',
			timeout: 15000,
			header: header,
			validateStatus: null
		})
	}
}
```

From then on, relative-path requests on the default instance go through that baseURL and automatically carry the default header (request-level same-name keys can override it):

```uts
import { get } from '@/uni_modules/ux-request'

get<UTSJSONObject>('/api/health', null).then((res) => {
	// res.config.header contains both x-client and the request-level header
})
```

## Related APIs

- [RequestDefaults](./type-request-defaults)
- [createRequest()](./create-request) (instance-level defaults)
- [Request Instance](./request-instance) (`setConfig`)
- [Multiple Instances and Global Defaults](../guide/instances)
