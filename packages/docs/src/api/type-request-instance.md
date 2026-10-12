# RequestInstance

`createRequest()` 返回的实例对象类型，与默认实例（顶层 API）同构——13 个成员，均为函数字段。使用文档见 [Request 实例](./request-instance)。

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

## 成员

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `request` | `(config: RequestConfig) => Promise<ResponseAny>` | 请求主入口，同 [request()](./request)，走本实例 defaults 与拦截器 |
| `get` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | GET 快捷方法 |
| `post` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | POST 快捷方法 |
| `put` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PUT 快捷方法 |
| `patch` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PATCH 快捷方法 |
| `del` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | DELETE 快捷方法 |
| `head` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | HEAD 快捷方法 |
| `options` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | OPTIONS 快捷方法 |
| `getUri` | `(config: RequestConfig \| null) => string` | 构建完整 URL，同 [getUri()](./get-uri)，走本实例 defaults |
| `setConfig` | `(defaults: RequestDefaults) => void` | 更新本实例默认配置，只影响本实例 |
| `useRequestInterceptor` | `(onFulfilled: (config: RequestConfig) => RequestConfig) => number` | 注册请求拦截器（本实例注册表） |
| `useResponseInterceptor` | `(onFulfilled: ((res: ResponseAny) => ResponseAny) \| null, onRejected: ((err: RequestError) => any \| null) \| null) => number` | 注册响应拦截器（本实例注册表） |
| `ejectInterceptor` | `(id: number) => void` | 按 id 移除本实例的拦截器 |

::: warning UTS 无 call signature
UTS 对象类型不支持 call signature，`instance(config)` 直调形态不可行——统一走 `instance.request(config)`（axios 自身亦有此方法）。
:::

::: tip del 命名
`delete` 为 UTS 保留字，DELETE 快捷方法统一命名 `del`（顶层 API 与实例一致）。
:::

::: tip 实例方法无泛型
顶层 API（`request<T>` / 七个快捷方法）提供泛型；实例方法 `data` 以 `any` 返回（`ResponseAny = ResponseResult<any>`），业务侧按需断言。这是泛型导出跨代理形态的既定边界，非遗漏。
:::

## 示例

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

## 相关 API

- [Request 实例](./request-instance)（各成员的详细行为）
- [createRequest()](./create-request)
- [RequestDefaults](./type-request-defaults)（`setConfig` 入参）
- [多实例与全局默认](../guide/instances)
