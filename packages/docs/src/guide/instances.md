# 多实例与全局默认

unix-request 提供两类实例：**默认实例**（模块级单例，顶层 API 即它）与 **`createRequest` 创建的独立实例**（对标 `axios.create`）。两者的 defaults 与拦截器注册表互相隔离。

## 默认实例：开箱即用

直接从包入口导入的 `request` / `get` / `post` 等全部绑定在默认实例上。全局默认可用 `configureRequest` 一次性设置：

```uts
import { configureRequest } from '@/uni_modules/mx-request'

const header: UTSJSONObject = {}
header['x-global'] = 'global-default'

configureRequest({
	baseURL: 'https://request.dcloud.net.cn',
	timeout: 15000,
	header: header,
	validateStatus: null
})
```

- 最常见的用法是放在 `App.uvue` 的 `onLaunch` 中，让全应用所有相对路径请求共享 baseURL 与默认 header；
- `RequestDefaults` 的 4 个字段（`baseURL` / `timeout` / `header` / `validateStatus`）均可为 `null`，为 `null` 表示回退内置默认（GET / 60000 毫秒 / 无 header / 2xx）；
- `configureRequest` 以新对象**整体替换**默认实例 defaults——只想改 baseURL 时也请把其余字段一并写全（不改的字段填 `null` 即回退内置默认）。

完整签名见 API 文档 [configureRequest()](../api/configure-request)。

## createRequest：多实例

```uts
import { createRequest } from '@/uni_modules/mx-request'

const instA = createRequest({ baseURL: 'https://a.example.com', timeout: 10000, header: null, validateStatus: null })
const instB = createRequest({ baseURL: 'https://b.example.com', timeout: 20000, header: null, validateStatus: null })

instA.getUri({ url: '/x' }) // https://a.example.com/x
instB.getUri({ url: '/x' }) // https://b.example.com/x
```

典型场景：一个应用同时对接业务服务与文件服务、多个环境网关、SDK 内部需要一套独立请求栈等。

::: tip 隔离范围
实例之间隔离的有两样东西：**defaults**（baseURL / timeout / header / validateStatus）与**拦截器注册表**——给 instA 注册的拦截器不会作用于 instB，也不会作用于默认实例，反之亦然。
:::

`defaults` 传 `null` 表示全部使用内置默认。完整签名见 API 文档 [createRequest()](../api/create-request)。

## 实例方法一览

实例对象与默认实例同构（成员完全一致）：

| 成员 | 说明 |
| --- | --- |
| `request(config)` | 主入口。UTS 无 call signature，实例不可像函数一样直接调用，统一走该方法 |
| `get` / `post` / `put` / `patch` / `del` / `head` / `options` | 快捷方法，method 由方法名固定注入 |
| `getUri(config)` | 离线构建完整 URL（含 params 编码） |
| `setConfig(defaults)` | 修改该实例的 defaults（作用等同默认实例的 `configureRequest`） |
| `useRequestInterceptor` / `useResponseInterceptor` / `ejectInterceptor` | 拦截器注册与移除（仅作用于本实例） |

```uts
instA.setConfig({ baseURL: 'https://c.example.com', timeout: null, header: null, validateStatus: null })
```

::: warning 实例方法返回 ResponseAny
顶层 API 提供泛型（如 `get<T>` 返回 `ResponseResult<T>`）；**实例方法的 data 以 `any` 返回**（`ResponseAny`），业务侧按需断言。这是 UTS 泛型跨代理形态的约束，详见[响应结构](./response-schema)。
:::

完整成员签名见 API 文档 [Request 实例](../api/request-instance) 与 [RequestInstance 类型](../api/type-request-instance)。

## 多实例隔离实测

以下为 playground 同款验证结构——defaults 隔离用 `getUri` 直观展示，拦截器隔离用 header 标记验证：

```uts
const netA = createRequest({ baseURL: HOST, timeout: 10000, header: null, validateStatus: null })
const netB = createRequest({ baseURL: HOST, timeout: 10000, header: null, validateStatus: null })

const rid = netA.useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['x-only-a'] = 'A'
	}
	return config
})

netA.request({ url: '/api/http/method/get' }).then((resA) => {
	netB.request({ url: '/api/http/method/get' }).then((resB) => {
		// resA.config.header 含 x-only-a: 'A'；resB.config.header 不含
		netA.ejectInterceptor(rid)
	})
})
```

## 下一步

- 拦截器的注册、错误三路径与实战配方 → [拦截器](./interceptors)
- 默认值如何与请求级配置合并 → [请求配置](./request-config)
