# 发起请求

unix-request 的对外请求入口分两层：`request<T>(config)` 主入口（一个对象描述全部配置）与七种快捷方法（方法名即 HTTP method）。两者都返回 `Promise<ResponseResult<T>>`，失败 reject `RequestError`。

## 主入口 `request<T>`

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<any>({
	url: '/api/http/method/get', // 必填；相对路径自动拼接 baseURL
	method: 'GET',
	params: { page: 1 } as UTSJSONObject
}).then((res) => {
	console.log('statusCode=' + res.statusCode.toString())
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code)
})
```

- `url` 是唯一必填字段，其余全部可选（不传或 `null` 使用实例默认）；
- 返回 `Promise<ResponseResult<T>>`，泛型 T 为 `res.data` 提供静态类型标注；
- 失败统一 reject `RequestError`，八类错误码见[错误处理](./error-handling)。

完整签名见 API 文档 [request()](../api/request) 与 [RequestConfig](../api/type-request-config)。

## 七种快捷方法

| 方法 | 签名 | 对应 method |
| --- | --- | --- |
| `get<T>` | `(url, config \| null)` | GET |
| `post<T>` | `(url, data \| null, config \| null)` | POST |
| `put<T>` | `(url, data \| null, config \| null)` | PUT |
| `patch<T>` | `(url, data \| null, config \| null)` | PATCH |
| `del<T>` | `(url, config \| null)` | DELETE |
| `head<T>` | `(url, config \| null)` | HEAD |
| `options<T>` | `(url, config \| null)` | OPTIONS |

```uts
import { get, post, del } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', null)
post<any>('/api/http/method/post', { name: 'mengxi' } as UTSJSONObject, null)
del<any>('/api/http/method/delete', null)
```

两条硬约束：

1. **method 由方法名固定注入**。快捷方法 config 的类型是 [RequestQuickConfig](../api/type-request-quick-config)——**没有 url 字段**（url 由方法参数提供，避免业务为满足必填 url 传占位值）；其中的 `method` 字段不会被透传，实际 method 恒等于方法名。需要自定义 method 时请用 `request` 主入口。
2. **`del` 因 `delete` 是 UTS 保留字而得名**，语义即 DELETE，实例方法同理。

## 请求级覆盖与默认实例

任何请求级字段都可以覆盖实例默认，且只影响当前这一次请求：

```uts
import { get } from '@/uni_modules/ux-request'

// 全局 baseURL 指向业务服务，这一次请求打到另一台机器、单独放宽超时
get<any>('https://other.example.com/api/slow', {
	timeout: 3000,
	header: { 'x-trace': 'on' } as UTSJSONObject // 与全局 header 浅合并，同名键覆盖
}).then((res) => {
	console.log(res.statusCode.toString())
})
```

合并规则（内置默认 → 实例默认 → 请求级）详见[请求配置](./request-config)；想把「每次都要写的配置」沉淀下来，见[多实例与全局默认](./instances)。

## data 去哪了

- **POST / PUT / PATCH**：`data` 作为请求体透传原生（`UTSJSONObject` / `string` / `ArrayBuffer`，App 端类型限制见[平台兼容性](./compatibility)）；
- **GET / HEAD**：`data` 为 `UTSJSONObject` 时自动编码并入 URL query，归一化后请求体恒为 `null`——这是库的显式契约（官方未明文 GET data 编码规则），详见[参数与请求头](./params-and-headers)。

## 错误处理概览

快捷方法与 `request` 主入口的失败路径完全一致：reject 同一个 `RequestError`，携带 8 类错误码、原生 errCode、HTTP 状态码与响应原文：

```uts
request<any>({ url: '/api/http/statusCode/404' }).catch((err) => {
	const e = err as RequestError
	// e.code === 'ERR_BAD_REQUEST'
	// e.statusCode === 404
	// e.response!.data === 服务端 404 响应体
})
```

系统化处理见[错误处理](./error-handling)。

## 下一步

- 每个配置字段的语义与三级合并 → [请求配置](./request-config)
- 响应对象的完整结构 → [响应结构](./response-schema)
- 快捷方法的精确签名 → API 文档 [快捷方法](../api/quick-methods)
