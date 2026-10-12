# 快捷方法

七个快捷方法是 [request()](./request) 的方法别名（对标 axios 方法别名），挂载在默认实例上，返回值与 `request()` 一致：成功 resolve [ResponseResult](./type-response)，失败 reject [RequestError](./type-request-error)。

```uts
import { get } from '@/uni_modules/ux-request'

get<UTSJSONObject>('/api/users/1', null).then((res) => {
	console.log(res.data)
})
```

## 签名一览

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `get` | `get<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | GET 请求 |
| `post` | `post<T>(url: string, data: any \| null, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | POST 请求，`data` 为请求体 |
| `put` | `put<T>(url: string, data: any \| null, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | PUT 请求 |
| `patch` | `patch<T>(url: string, data: any \| null, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | PATCH 请求 |
| `del` | `del<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | DELETE 请求。`delete` 为 UTS 保留字，故命名 `del` |
| `head` | `head<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | HEAD 请求 |
| `options` | `options<T>(url: string, config: RequestQuickConfig \| null): Promise<ResponseResult<T>>` | OPTIONS 请求 |

::: warning method 由方法名固定注入
`config` 中的 `method` 字段**不会被透传**——method 由快捷方法名决定（`post()` 一律发 POST）。这与 axios 语义一致：快捷方法的第二个/第三个参数只提供请求级覆盖（header、params、timeout 等），不提供改写 method 的能力。
:::

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 请求路径。相对路径拼接 baseURL，`http(s)` 开头原样使用 |
| `data` | `any \| null` | 仅 `post` / `put` / `patch` 提供。请求体，透传原生 adapter 序列化 |
| `config` | [RequestQuickConfig](./type-request-quick-config) \| `null` | 请求级配置（不含 `url` 字段），可为 `null` |

## 返回值

`Promise<ResponseResult<T>>`，与 [request()](./request) 完全同构：`T` 仅静态标注 `data` 类型；失败 reject [RequestError](./type-request-error)。

## 示例

### get / post

```uts
import { get, post } from '@/uni_modules/ux-request'

// GET：params 走 config
get<Array<UTSJSONObject>>('/api/users', {
	params: { 'page': 1, 'size': 20 }
}).then((res) => {
	console.log(res.data.length)
})

// POST：data 是第二参数
post<UTSJSONObject>('/api/users', { 'name': 'MengXi' }, null).then((res) => {
	console.log(res.statusCode)
})
```

### put / patch / del

```uts
import { put, patch, del } from '@/uni_modules/ux-request'

put<UTSJSONObject>('/api/users/1', { 'name': 'new-name' }, null)
patch<UTSJSONObject>('/api/users/1', { 'remark': 'x' }, null)
del<UTSJSONObject>('/api/users/1', null)
```

### head / options

```uts
import { head, options } from '@/uni_modules/ux-request'

head<UTSJSONObject>('/api/health', null).then((res) => {
	console.log(res.statusCode, res.header)
})

options<UTSJSONObject>('/api/users', null)
```

## 相关 API

- [request()](./request)
- [RequestQuickConfig](./type-request-quick-config)
- [Request 实例](./request-instance)（实例上的同名快捷方法）
- [参数与请求头](../guide/params-and-headers)
