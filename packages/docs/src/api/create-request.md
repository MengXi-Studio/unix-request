# createRequest()

`createRequest(defaults: RequestDefaults | null): RequestInstance` 创建一个独立的请求实例（对标 `axios.create`）。实例拥有自己的 [RequestDefaults](./type-request-defaults) 与拦截器注册表，与默认实例完全隔离。

```uts
import { createRequest } from '@/uni_modules/ux-request'

const api = createRequest({
	baseURL: 'https://api.example.com',
	timeout: 10000,
	header: null,
	validateStatus: null
})

api.get<UTSJSONObject>('/users/1', null).then((res) => {
	console.log(res.data)
})
```

## 为什么需要多实例

默认实例（[request()](./request) 等顶层 API）是模块级单例，`configureRequest` 修改的 defaults 与 `useRequestInterceptor` 注册的拦截器都挂在它身上。以下场景需要相互隔离的多实例：

- **多个服务端**：业务 API 与第三方 API 各有 baseURL、超时、鉴权 header；
- **拦截器互不污染**：A 实例注入的 token header 不应出现在 B 实例的请求上（注册表随实例隔离，见下例）；
- **局部环境复现**：如隔离实例上复现「相对路径无 baseURL」的 `ERR_CONFIG`，不受全局 baseURL 影响。

## 参数

`createRequest(defaults: RequestDefaults | null)`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `defaults` | [RequestDefaults](./type-request-defaults) \| `null` | 实例默认配置。传 `null` 表示全部使用内置默认（baseURL 无 / timeout `60000` / header 空 / validateStatus 2xx） |

## 返回值

返回 [RequestInstance](./type-request-instance)——与默认实例同构的实例对象，成员清单见 [Request 实例](./request-instance)。实例方法不提供泛型，`data` 以 `any` 返回（`ResponseAny`），业务侧按需断言。

::: tip 拦截器注册表隔离
每个实例的请求/响应拦截器注册表独立维护：在实例 A 上 `useRequestInterceptor` 注册的拦截器只作用于 A 的请求，`ejectInterceptor` 也只查 A 的注册表。默认实例的拦截器见 [拦截器 API](./interceptors)。
:::

## 示例

### 双服务端隔离

```uts
import { createRequest } from '@/uni_modules/ux-request'

// 业务 API：长超时 + 鉴权 header
const authHeader: UTSJSONObject = {}
authHeader['Authorization'] = 'Bearer <token>'

const api = createRequest({
	baseURL: 'https://api.example.com',
	timeout: 15000,
	header: authHeader,
	validateStatus: null
})

// 对象存储：短超时、无鉴权
const oss = createRequest({ baseURL: 'https://oss.example.com', timeout: 5000, header: null, validateStatus: null })

api.get<UTSJSONObject>('/me', null)
oss.get<UTSJSONObject>('/bucket/a.png', null)
```

### 实例级拦截器隔离

```uts
import { createRequest } from '@/uni_modules/ux-request'

const a = createRequest({ baseURL: 'https://a.test', timeout: 10000, header: null, validateStatus: null })
const b = createRequest({ baseURL: 'https://b.test', timeout: 10000, header: null, validateStatus: null })

// 只对 a 生效
const rid = a.useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['x-only-a'] = 'A'
	}
	return config
})

a.request({ url: '/x' }).then((resA) => {
	b.request({ url: '/x' }).then((resB) => {
		// resA.config 带 x-only-a，resB.config 没有
		a.ejectInterceptor(rid)
	})
})
```

## 相关 API

- [Request 实例](./request-instance)
- [RequestInstance](./type-request-instance)
- [RequestDefaults](./type-request-defaults)
- [configureRequest()](./configure-request)
- [多实例与全局默认](../guide/instances)
