# Request 实例

`createRequest()` 返回的 `RequestInstance` 实例对象，与默认实例（顶层 API）同构：请求方法、URL 构建、拦截器注册、默认配置修改一应俱全，但 defaults 与拦截器注册表各自独立。类型定义见 [RequestInstance](./type-request-instance)。

```uts
import { createRequest } from '@/uni_modules/mx-request'

const api = createRequest(null)

api.request({ url: '/api/health' }).then((res) => {
	console.log(res.statusCode)
})
```

## 方法一览

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `request` | `(config: RequestConfig) => Promise<ResponseAny>` | 请求主入口，同 [request()](./request) |
| `get` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | GET 快捷方法 |
| `post` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | POST 快捷方法 |
| `put` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PUT 快捷方法 |
| `patch` | `(url: string, data: any \| null, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | PATCH 快捷方法 |
| `del` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | DELETE 快捷方法（`delete` 为 UTS 保留字） |
| `head` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | HEAD 快捷方法 |
| `options` | `(url: string, config: RequestQuickConfig \| null) => Promise<ResponseAny>` | OPTIONS 快捷方法 |
| `getUri` | `(config: RequestConfig \| null) => string` | 构建完整 URL，同 [getUri()](./get-uri)，走本实例 defaults |
| `setConfig` | `(defaults: RequestDefaults) => void` | 更新本实例默认配置（同 [configureRequest()](./configure-request) 但只影响本实例） |
| `useRequestInterceptor` | `(onFulfilled: (config: RequestConfig) => RequestConfig) => number` | 注册请求拦截器（本实例注册表） |
| `useResponseInterceptor` | `(onFulfilled: ((res: ResponseAny) => ResponseAny) \| null, onRejected: ((err: RequestError) => any \| null) \| null) => number` | 注册响应拦截器（本实例注册表），语义同 [拦截器 API](./interceptors) |
| `ejectInterceptor` | `(id: number) => void` | 按 id 移除本实例的拦截器 |

::: warning UTS 无 call signature
UTS 对象不支持像函数那样直接调用，axios 的 `instance(config)` 直调形态不可行，统一走 `instance.request(config)`（axios 自身亦有此方法）。
:::

::: tip 实例方法返回 ResponseAny
实例方法（含快捷方法）返回 `ResponseAny = ResponseResult<any>`，`data` 以 `any` 流转——泛型标注仅顶层 API 提供，业务侧按需断言：

```uts
api.get<...> // ✗ 无泛型形态
api.get('/users/1', null).then((res) => {
	const user = res.data as UTSJSONObject
})
```
:::

## 示例

### setConfig 更新实例默认

```uts
import { createRequest } from '@/uni_modules/mx-request'

const api = createRequest({ baseURL: 'https://dev.example.com', timeout: 10000, header: null, validateStatus: null })

// 切换环境：只影响 api 实例，默认实例与其他实例不受影响
const header: UTSJSONObject = {}
header['x-env'] = 'prod'
api.setConfig({ baseURL: 'https://api.example.com', timeout: 15000, header: header, validateStatus: null })
```

### 实例拦截器 + eject

```uts
import { createRequest } from '@/uni_modules/mx-request'
import type { RequestError, ResponseAny } from '@/uni_modules/mx-request'

const api = createRequest({ baseURL: 'https://api.example.com', timeout: 10000, header: null, validateStatus: null })

const rid = api.useResponseInterceptor(null, (err) => {
	if (err.code == 'ERR_TIMEOUT') {
		// 换错：统一转成业务错误提示
	}
	return err
})

api.request({ url: '/x' }).catch((e) => {
	console.log((e as RequestError).code)
})
api.ejectInterceptor(rid)
```

## 相关 API

- [createRequest()](./create-request)
- [RequestInstance](./type-request-instance)
- [拦截器 API](./interceptors)
- [多实例与全局默认](../guide/instances)
