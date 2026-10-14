# CancelToken / CancelSource

取消请求的两个类型，由 [createCancelSource()](./create-cancel-source) 创建（与 axios `CancelToken.source()` 同心智）：`token` 挂到 [RequestConfig](./type-request-config) 的 `cancelToken` 字段，`cancel(reason)` 取消关联请求。

```uts
/** 取消令牌 */
export type CancelToken = {
	/** 是否已取消 */
	canceled: boolean
	/** 取消原因；未取消为 null */
	reason: string | null
}

/** 取消源（createCancelSource 返回，与 axios CancelToken.source() 同心智） */
export type CancelSource = {
	/** 关联令牌（挂到 RequestConfig.cancelToken） */
	token: CancelToken
	/** 取消该令牌关联的全部进行中请求 */
	cancel: (reason: string | null) => void
}
```

## CancelToken 字段

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `canceled` | `boolean` | 是否已取消。`cancel()` 调用后置为 `true`，此后该 token 关联的新请求在发送前即被拦截 |
| `reason` | `string \| null` | 取消原因；未取消为 `null`。体现在 `ERR_CANCELED` 的 `errMsg` 中（`请求已取消：<reason>`） |

## CancelSource 字段

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `token` | `CancelToken` | 取消令牌，挂到 `RequestConfig.cancelToken` |
| `cancel` | `(reason: string \| null) => void` | 取消该 token 关联的**全部**进行中请求（库内确定性 `abort()`）；重复调用幂等 |

::: warning 业务自建 token 的能力边界
`CancelToken` 是普通对象类型，业务可自建 `{ canceled: true, reason: 'x' }`——但这类 token 不在库内注册表，**只有发送前检查**（已取消则 `ERR_CANCELED` 不发网络）；飞行中确定性 abort 须经 `createCancelSource()` 创建的 token。
:::

## 示例

```uts
import { request, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

const source = createCancelSource()

request<UTSJSONObject>({ url: '/api/heavy', cancelToken: source.token }).then((res) => {
	console.log(res.statusCode)
}).catch((err) => {
	const e = err as RequestError
	if (e.code == 'ERR_CANCELED') {
		console.log(source.token.canceled) // true
		console.log(source.token.reason)   // '页面卸载'
	}
})

setTimeout(() => {
	source.cancel('页面卸载')
}, 100)
```

## 相关 API

- [createCancelSource()](./create-cancel-source)
- [RequestConfig](./type-request-config)（`cancelToken` 字段）
- [RequestErrorCode](./type-request-error-code)（`ERR_CANCELED`）
- [取消请求](../guide/cancel)
