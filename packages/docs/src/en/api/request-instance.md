# Request Instance

The `RequestInstance` object returned by `createRequest()`, structurally identical to the default instance (top-level APIs): request methods, URL building, interceptor registration, and default-config updates are all there, but defaults and interceptor registries are independent per instance. For the type definition see [RequestInstance](./type-request-instance).

```uts
import { createRequest } from '@/uni_modules/mx-request'

const api = createRequest(null)

api.request({ url: '/api/health' }).then((res) => {
	console.log(res.statusCode)
})
```

## Methods at a Glance

| Method | Signature | Description |
| --- | --- | --- |
| `request` | `(config: RequestConfig) => Promise<ResponseAny>` | Main request entry, same as [request()](./request) |
| `get` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | GET shortcut |
| `post` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | POST shortcut |
| `put` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PUT shortcut |
| `patch` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PATCH shortcut |
| `del` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | DELETE shortcut (`delete` is a UTS reserved word) |
| `head` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | HEAD shortcut |
| `options` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | OPTIONS shortcut |
| `getUri` | `(config: RequestConfig \| null) => string` | Builds the full URL, same as [getUri()](./get-uri), using this instance's defaults |
| `setConfig` | `(defaults: RequestDefaults) => void` | Updates this instance's default configuration (like [configureRequest()](./configure-request) but only affects this instance) |
| `useRequestInterceptor` | `(onFulfilled: (config: RequestConfig) => RequestConfig) => number` | Registers a request interceptor (this instance's registry) |
| `useResponseInterceptor` | `(onFulfilled: ((res: ResponseAny) => ResponseAny) \| null, onRejected: ((err: RequestError) => any \| null) \| null) => number` | Registers a response interceptor (this instance's registry), same semantics as [Interceptor API](./interceptors) |
| `ejectInterceptor` | `(id: number) => void` | Removes this instance's interceptor by id |

::: warning UTS has no call signature
UTS objects cannot be invoked directly like functions, so axios's `instance(config)` direct-call form is not viable; always use `instance.request(config)` (axios itself has this method too).
:::

::: tip Instance methods return ResponseAny
Instance methods (including the shortcuts) return `ResponseAny = ResponseResult<any>`, with `data` flowing as `any` — generics are only provided by the top-level APIs; cast as needed on the business side:

```uts
api.get<...> // ✗ no generic form
api.get('/users/1', null).then((res) => {
	const user = res.data as UTSJSONObject
})
```
:::

## Examples

### setConfig updates instance defaults

```uts
import { createRequest } from '@/uni_modules/mx-request'

const api = createRequest({ baseURL: 'https://dev.example.com', timeout: 10000, header: null, validateStatus: null })

// Switch environment: only affects the api instance; the default instance and other instances are unaffected
const header: UTSJSONObject = {}
header['x-env'] = 'prod'
api.setConfig({ baseURL: 'https://api.example.com', timeout: 15000, header: header, validateStatus: null })
```

### Instance interceptor + eject

```uts
import { createRequest } from '@/uni_modules/mx-request'
import type { RequestError, ResponseAny } from '@/uni_modules/mx-request'

const api = createRequest({ baseURL: 'https://api.example.com', timeout: 10000, header: null, validateStatus: null })

const rid = api.useResponseInterceptor(null, (err) => {
	if (err.code == 'ERR_TIMEOUT') {
		// Swap the error: uniformly convert it into a business error message
	}
	return err
})

api.request({ url: '/x' }).catch((e) => {
	console.log((e as RequestError).code)
})
api.ejectInterceptor(rid)
```

## Related APIs

- [createRequest()](./create-request)
- [RequestInstance](./type-request-instance)
- [Interceptor API](./interceptors)
- [Multiple Instances and Global Defaults](../guide/instances)
