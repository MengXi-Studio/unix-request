# RequestDefaults

The global / instance default configuration type — the unified input of [configureRequest()](./configure-request), [createRequest()](./create-request), and the instance `setConfig`. All four fields must be present (may be `null`).

```uts
/** Global / instance default configuration (input of configureRequest / createRequest / setConfig; null means the built-in default applies) */
export type RequestDefaults = {
	/** Default baseURL */
	baseURL: string | null
	/** Default timeout (ms) */
	timeout: number | null
	/** Default header (shallow-merged with the request level) */
	header: UTSJSONObject | null
	/** Default status code check */
	validateStatus: ((statusCode: number) => boolean) | null
}
```

## Fields

| Name | Type | Built-in default when `null` | Description |
| --- | --- | --- | --- |
| `baseURL` | `string \| null` | None | Default baseURL; when `null` and the request uses a relative path, fails fast with `ERR_CONFIG` |
| `timeout` | `number \| null` | `60000` | Entry constant `DEFAULT_TIMEOUT`; overridden whenever the request-level `timeout` provides a value |
| `header` | `UTSJSONObject \| null` | Empty | Default header, shallow-merged with the request-level header (request-level keys override same-name keys) |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | 2xx check | Default status code check (`statusCode >= 200 && statusCode < 300`); overridden as a whole whenever the request level provides a value |

::: tip Meaning of null
A `null` field means **the built-in default applies** (not "clear this configuration") — the normalization layer checks for null item by item and falls back. Therefore "remove the global header" should pass an empty object `{}`; passing `null` also yields an empty header, but the former is semantically preferred; there is no way to express "clear the baseURL" (the built-in default is no baseURL anyway).
:::

## Usage Sites

| Entry | Scope | Description |
| --- | --- | --- |
| [configureRequest(defaults)](./configure-request) | Default instance | Global defaults, usually called once in `App.uvue` `onLaunch` |
| [createRequest(defaults)](./create-request) | New instance | Injected at creation; instances are isolated from each other |
| `instance.setConfig(defaults)` | Existing instance | Updates instance defaults at runtime (e.g. environment switching); see [Request Instance](./request-instance) |

::: warning No method field
`RequestDefaults` only has the four fields above — the default method is fixed to `'GET'` (entry constant `DEFAULT_METHOD`) and cannot be customized per instance; pass `method` explicitly at the request level or use the [shortcut methods](./quick-methods) for other methods.
:::

## Examples

```uts
import { configureRequest, createRequest } from '@/uni_modules/mx-request'

// Global defaults
const globalHeader: UTSJSONObject = {}
globalHeader['x-client'] = 'uni-app-x'
configureRequest({
	baseURL: 'https://api.example.com',
	timeout: 15000,
	header: globalHeader,
	validateStatus: null // keep the built-in 2xx check
})

// Instance defaults (independent of the global defaults)
const oss = createRequest({ baseURL: 'https://oss.example.com', timeout: 5000, header: null, validateStatus: null })
```

## Related APIs

- [configureRequest()](./configure-request)
- [createRequest()](./create-request)
- [Request Instance](./request-instance) (`setConfig`)
- [Multiple Instances and Global Defaults](../guide/instances)
