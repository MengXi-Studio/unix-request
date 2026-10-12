# request()

`request<T>(config: RequestConfig): Promise<ResponseResult<T>>` 发起一次 HTTP 请求，是库的主入口（挂载在默认实例上）。成功 resolve 统一响应结构 [ResponseResult](./type-response)，失败 reject 统一错误结构 [RequestError](./type-request-error)，调用侧只需面对一个 Promise。

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<{ id: number, name: string }>({
	url: '/api/users/1',
	method: 'GET'
}).then((res) => {
	console.log(res.statusCode, res.data.name)
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code, e.errMsg)
})
```

## 参数

`request<T>(config: RequestConfig)`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `config` | [RequestConfig](./type-request-config) | 是 | 请求配置。`url` 必填，其余字段全部可选（完整字段与合并规则见 [RequestConfig](./type-request-config)） |

常用字段速览：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**。相对路径拼接 baseURL，`http(s)` 开头原样使用 |
| `method` | `RequestMethod` | `'GET'` | 与入口常量 `DEFAULT_METHOD` 一致 |
| `baseURL` | `string \| null` | 实例默认 | 请求级覆盖全局 baseURL |
| `params` | `UTSJSONObject \| null` | — | 查询参数，库内确定性编码进 url |
| `data` | `any \| null` | — | 请求体；GET/HEAD 的 UTSJSONObject 自动并入 query |
| `header` | `UTSJSONObject \| null` | — | 与实例默认 header 浅合并，请求级同名键覆盖 |
| `timeout` | `number \| null` | `60000` | 与入口常量 `DEFAULT_TIMEOUT` 一致 |
| `validateStatus` | `(statusCode: number) => boolean \| null` | 2xx 校验 | 不通过时按 4xx / 5xx 归类错误 |
| `cancelToken` | `CancelToken \| null` | `null` | 传入即可取消，见 [createCancelSource()](./create-cancel-source) |

## 返回值

`Promise<ResponseResult<T>>`：

- 成功 resolve [ResponseResult](./type-response)，`data` 为泛型 `T`（仅作消费侧静态标注，实际以 `any` 流转，业务按需断言）；
- 原生空响应体（如 HEAD、204）归一为空对象，`data` 契约保持非空。

## 错误

失败 reject [RequestError](./type-request-error)，错误码见 [RequestErrorCode](./type-request-error-code)。典型路径：

- **发送前 fail-fast（不发网络）**：`url` 为空 → `ERR_PARAM`；相对路径且无 baseURL → `ERR_CONFIG`；token 已取消 → `ERR_CANCELED`；
- **HTTP 层**：`validateStatus`（默认 2xx）未通过时，4xx → `ERR_BAD_REQUEST`、5xx → `ERR_BAD_RESPONSE`，`error.response` 携带响应原文（含 body）；
- **网络层**：超时 → `ERR_TIMEOUT`（`nativeErrCode` 透传 `5`）、网络中断 → `ERR_NETWORK`、其余原生失败 → `ERR_NATIVE`。

::: tip 拦截器
发送前 config 会依次经过请求拦截器链，响应会经过响应拦截器链（均为默认实例注册表）。拦截器的完整语义见 [拦截器 API](./interceptors) 与 [拦截器指南](../guide/interceptors)。
:::

## 示例

### 成功（POST + params + header）

```uts
import { request } from '@/uni_modules/ux-request'

const header: UTSJSONObject = {}
header['Authorization'] = 'Bearer <token>'

request<UTSJSONObject>({
	url: '/api/users',
	method: 'POST',
	params: { 'lang': 'zh-CN' },
	data: { 'name': 'MengXi' },
	header: header,
	timeout: 15000
}).then((res) => {
	console.log('statusCode=' + res.statusCode)
})
```

### 失败（HTTP 4xx 携带响应原文）

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<UTSJSONObject>({ url: '/api/missing' }).then((res) => {
	// 4xx 默认不会走到这里（validateStatus 未通过）
}).catch((err) => {
	const e = err as RequestError
	// e.code === 'ERR_BAD_REQUEST'，e.statusCode === 404
	// e.response?.data 为服务端返回的错误 body
	console.log(e.code, e.errMsg)
})
```

## 相关 API

- [快捷方法](./quick-methods)
- [RequestConfig](./type-request-config)
- [ResponseResult](./type-response)
- [RequestError](./type-request-error)
- [发起请求](../guide/requests)
