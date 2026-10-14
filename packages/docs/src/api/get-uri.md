# getUri()

`getUri(config: RequestConfig | null): string` 根据配置离线构建完整 URL，**不发网络、不跑拦截器**（挂载在默认实例上，走其 defaults；实例版见 [Request 实例](./request-instance) 的 `getUri`）。

```uts
import { getUri, configureRequest } from '@/uni_modules/mx-request'

configureRequest({ baseURL: 'https://api.example.com', timeout: 60000, header: null, validateStatus: null })

getUri({ url: '/users', params: { 'page': 1 } })
// → https://api.example.com/users?page=1
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `config` | [RequestConfig](./type-request-config) \| `null` | 请求配置。传 `null` 返回空字符串 |

## 返回值

`string`——归一化后的完整地址。取值规则：

- 归一化成功：返回拼接完成的 url（baseURL 拼接 + query 编码均已完成）；
- 归一化失败（`ERR_PARAM` / `ERR_CONFIG`，如相对路径且无 baseURL）：返回**原始 `config.url`** 兜底，不抛错；
- `config` 为 `null`：返回 `''`。

## 编码规则

`getUri()` 与真实请求走同一套归一化逻辑（与 [request()](./request) 结果严格一致）：

- **params**：键值均 `encodeURIComponent` 转义后以 `key=value&…` 拼接；`null` 值键跳过；`string` 原样、`number` / `boolean` 转字符串、其余（UTSJSONObject / 数组 / 类型实例）`JSON.stringify`；
- **GET / HEAD 的 data**：`data` 为 UTSJSONObject 时自动并入 query（排在 params 之后），不再作为请求体；
- **既有 query 合并**：url 自带 `?` 时用 `&` 续接，尾部 `?` / `&` 容错；
- **baseURL 拼接**：`http(s)` 开头原样使用；相对路径拼接 baseURL（双侧斜杠容错）。

::: tip 调试用途
`getUri()` 适合日志埋点、埋链校验与「请求到底长什么样」的调试场景，也常用于测试实例 defaults 是否生效。
:::

## 示例

```uts
import { getUri } from '@/uni_modules/mx-request'

// params 编码（空格 → %20）
getUri({ url: '/search', params: { 'q': 'uni app', 'page': 2 } })
// → /search?q=uni%20app&page=2

// GET data 并入 query（排在 params 之后）
getUri({ url: '/list', params: { 'a': 1 }, data: { 'b': 2 } })
// → /list?a=1&b=2

// 既有 query 用 & 续接
getUri({ url: '/list?from=push', params: { 'a': 1 } })
// → /list?from=push&a=1

// 相对路径且无 baseURL：原样返回，不抛错
getUri({ url: '/relative' })
// → /relative
```

## 相关 API

- [request()](./request)
- [RequestConfig](./type-request-config)
- [Request 实例](./request-instance)（实例版 `getUri`）
- [参数与请求头](../guide/params-and-headers)
