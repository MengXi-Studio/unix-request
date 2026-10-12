# RequestInstance

The instance object type returned by `createRequest()`, structurally identical to the default instance (top-level APIs) — 13 members, all function fields. For usage documentation see [Request Instance](./request-instance).

```uts
export type RequestInstance = {
	request: (config: RequestConfig) => Promise<ResponseAny>
	get: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	post: (url: string, data: any | null, config: RequestQuickConfig | null) => Promise<ResponseAny>
	put: (url: string, data: any | null, config: RequestQuickConfig | null) => Promise<ResponseAny>
	patch: (url: string, data: any | null, config: RequestQuickConfig | null) => Promise<ResponseAny>
	del: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	head: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	options: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	getUri: (config: RequestConfig | null) => string
	setConfig: (defaults: RequestDefaults) => void
	useRequestInterceptor: (onFulfilled: (config: RequestConfig) => RequestConfig) => number
	useResponseInterceptor: (onFulfilled: ((res: ResponseAny) => ResponseAny) | null, onRejected: ((err: RequestError) => any | null) | null) => number
	ejectInterceptor: (id: number) => void
}
```

## Members

| Member | Type | Description |
| --- | --- | --- |
| `request` | `(config: RequestConfig) => Promise<ResponseAny>` | Main request entry, same as [request()](./request), using this instance's defaults and interceptors |
| `get` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | GET shortcut |
| `post` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | POST shortcut |
| `put` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PUT shortcut |
| `patch` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PATCH shortcut |
| `del` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | DELETE shortcut |
| `head` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | HEAD shortcut |
| `options` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | OPTIONS shortcut |
| `getUri` | `(config: RequestConfig \| null) => string` | Builds the full URL, same as [getUri()](./get-uri), using this instance's defaults |
| `setConfig` | `(defaults: RequestDefaults) => void` | Updates this instance's default configuration; only affects this instance |
| `useRequestInterceptor` | `(onFulfilled: (config: RequestConfig) => RequestConfig) => number` | Registers a request interceptor (this instance's registry) |
| `useResponseInterceptor` | `(onFulfilled: ((res: ResponseAny) => ResponseAny) \| null, onRejected: ((err: RequestError) => any \| null) \| null) => number` | Registers a response interceptor (this instance's registry) |
| `ejectInterceptor` | `(id: number) => void` | Removes this instance's interceptor by id |

::: warning UTS has no call signature
UTS object types do not support call signatures, so the `instance(config)` direct-call form is not viable — always use `instance.request(config)` (axios itself has this method too).
:::

::: tip The del naming
`delete` is a UTS reserved word, so the DELETE shortcut is uniformly named `del` (consistent between the top-level API and instances).
:::

::: tip Instance methods have no generics
The top-level APIs (`request<T>` / the seven shortcut methods) provide generics; instance methods return `data` as `any` (`ResponseAny = ResponseResult<any>`), cast as needed on the business side. This is the established boundary of generic exports across the proxy form, not an omission.
:::

## Examples

```uts
import { createRequest } from '@/uni_modules/ux-request'
import type { RequestInstance, RequestError } from '@/uni_modules/ux-request'

const api: RequestInstance = createRequest({
	baseURL: 'https://api.example.com',
	timeout: 10000,
	header: null,
	validateStatus: null
})

api.request({ url: '/users/1' }).then((res) => {
	console.log((res.data as UTSJSONObject)['name'])
}).catch((err) => {
	console.log((err as RequestError).code)
})
```

## Related APIs

- [Request Instance](./request-instance) (detailed behavior of each member)
- [createRequest()](./create-request)
- [RequestDefaults](./type-request-defaults) (the `setConfig` input)
- [Multiple Instances and Global Defaults](../guide/instances)
