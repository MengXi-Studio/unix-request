# createCancelSource()

`createCancelSource(): CancelSource` 创建取消源（与 axios `CancelToken.source()` 同心智）：把 `token` 挂到 [RequestConfig](./type-request-config) 的 `cancelToken` 字段，调用 `cancel(reason)` 即取消该 token 关联的全部进行中请求。

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

const source = createCancelSource()

request<UTSJSONObject>({ url: '/api/heavy-report', cancelToken: source.token }).catch((err) => {
	const e = err as RequestError
	console.log(e.code) // ERR_CANCELED
})

// 页面卸载时取消
source.cancel('页面卸载')
```

## 返回值

返回 [CancelSource](./type-cancel)：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `token` | [CancelToken](./type-cancel) | 取消令牌，挂到 `RequestConfig.cancelToken` |
| `cancel` | `(reason: string \| null) => void` | 取消该 token 关联的全部进行中请求；`reason` 记录到 `token.reason` 并体现在错误信息中 |

## 取消语义

取消由库内确定性实现（主动调 `task.abort()`），不依赖原生 errMsg 特征匹配：

- **发送前已取消**：请求直接 reject `ERR_CANCELED`，**不发网络**；
- **飞行中取消**：在途任务被 abort，fail 后按 `token.canceled` 标志归类 `ERR_CANCELED`；
- **一个 token 关联多个请求**：`cancel()` 一次性取消全部；
- **重复 `cancel()`**：幂等，首次之后的调用为空操作；
- 取消错误信息携带原因：`errMsg` 形如 `请求已取消：页面卸载`（无 reason 时为 `请求已取消`）。

::: warning 业务自建 token 仅享受发送前检查
`CancelToken` 是普通对象类型，业务可以自建 `{ canceled: true, reason: null }` 使用，但这类 token 不在库内注册表中——只享受「发送前已取消则拦截」，飞行中 abort 需经 `createCancelSource()` 创建的 token。
:::

## 示例

### 发送前已取消 + 飞行中取消

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

// 场景一：发送前已取消 → 不发网络，立即 reject ERR_CANCELED
const pre = createCancelSource()
pre.cancel('发送前取消')
request<UTSJSONObject>({ url: '/api/list', cancelToken: pre.token }).then((res) => {
	// 不会走到这里
}).catch((err) => {
	console.log((err as RequestError).code) // ERR_CANCELED
})

// 场景二：飞行中取消 → abort 在途请求
const fly = createCancelSource()
request<UTSJSONObject>({ url: '/api/list', cancelToken: fly.token }).catch((err) => {
	console.log((err as RequestError).code) // ERR_CANCELED
})
setTimeout(() => {
	fly.cancel('页面卸载')
}, 100)
```

### 竞态防护（只保留最后一次搜索）

```uts
import { get, createCancelSource } from '@/uni_modules/mx-request'

let searchSource = createCancelSource()

function onSearchInput(keyword: string): void {
	searchSource.cancel('新搜索')
	searchSource = createCancelSource()
	get<UTSJSONObject>('/api/search', { params: { 'q': keyword }, cancelToken: searchSource.token }).then((res) => {
		render(res.data)
	}).catch(() => {
		// 被取消的旧请求在此静默
	})
}
```

## 相关 API

- [CancelToken / CancelSource](./type-cancel)
- [RequestConfig](./type-request-config)（`cancelToken` 字段）
- [RequestErrorCode](./type-request-error-code)（`ERR_CANCELED`）
- [取消请求](../guide/cancel)
