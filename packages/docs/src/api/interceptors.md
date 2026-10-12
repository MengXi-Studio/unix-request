# 拦截器 API

默认实例的拦截器注册与移除共三个函数：`useRequestInterceptor` / `useResponseInterceptor` / `ejectInterceptor`。拦截器多枚、有序、可移除，v1 仅支持同步回调。实例上另有同名方法（见 [Request 实例](./request-instance)），注册表随实例隔离。

```uts
import { useRequestInterceptor } from '@/uni_modules/ux-request'

const id = useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['Authorization'] = 'Bearer <token>'
	}
	return config
})
```

## useRequestInterceptor(onFulfilled)

`(onFulfilled: (config: RequestConfig) => RequestConfig): number`

注册**请求拦截器**。请求发出前按注册顺序逐层变换 [RequestConfig](./type-request-config)，上一层的返回值作为下一层入参：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `onFulfilled` | `(config: RequestConfig) => RequestConfig` | 变换 config 并返回。**必须返回 config**，返回值进入下一层拦截器 |

返回 `number`——拦截器 id，供 [ejectInterceptor](#ejectinterceptor-id) 移除。

## useResponseInterceptor(onFulfilled, onRejected)

```uts
useResponseInterceptor(
	onFulfilled: ((res: ResponseAny) => ResponseAny) | null,
	onRejected: ((err: RequestError) => any | null) | null
): number
```

注册**响应拦截器**，成功链与错误链均按注册顺序执行：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `onFulfilled` | `((res: ResponseAny) => ResponseAny) \| null` | 成功态回调：变换响应并返回，`null` 表示不处理成功路径 |
| `onRejected` | `((err: RequestError) => any \| null) \| null` | 错误态回调，见下方三条路径；`null` 表示不处理错误路径 |

`onRejected` 的返回值决定错误走向（axios 链语义）：

| 返回值 | 语义 | 后续走向 |
| --- | --- | --- |
| `ResponseResult` | **恢复** | 转为 resolve，后续拦截器回到成功态 |
| `RequestError` | **换错** | 以新错误继续 reject（错误转换） |
| `null` | **放行** | 携带原错误继续 reject |

::: warning 拦截器内抛出的任何异常视为链路 bug
库内会捕获并转为 `ERR_NATIVE`（规避 UTS throw 约束破坏链路）。业务分支请用「返回值」表达，不要依赖抛异常；恢复/换错的判别基于 `errSubject === 'unix-request'` 契约（[RequestError](./type-request-error)），换错时请沿用库内错误结构。
:::

## ejectInterceptor(id)

`(id: number): void`

按 id 移除拦截器（请求/响应注册表都会查找）。id 为 `useRequestInterceptor` / `useResponseInterceptor` 的返回值；移除不存在的 id 是空操作。

## 返回值

两个注册函数均返回 `number` 拦截器 id（请求/响应共用一个自增计数，全实例唯一）。

## 示例

### 请求拦截器注入 token + 响应拦截器统一换错

```uts
import { useRequestInterceptor, useResponseInterceptor, ejectInterceptor } from '@/uni_modules/ux-request'
import type { RequestError, ResponseAny } from '@/uni_modules/ux-request'

// 注入鉴权 header
const rid1 = useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['Authorization'] = 'Bearer ' + token()
	}
	return config
})

// 401 统一登出（换错），其余放行
const rid2 = useResponseInterceptor(null, (err) => {
	if (err.code == 'ERR_BAD_REQUEST' && err.statusCode == 401) {
		logout()
	}
	return null
})

// 登出后移除
// ejectInterceptor(rid1)
// ejectInterceptor(rid2)
```

### 错误恢复（降级兜底）

```uts
import { useResponseInterceptor } from '@/uni_modules/ux-request'
import type { RequestError, ResponseAny } from '@/uni_modules/ux-request'

useResponseInterceptor(null, (err): any | null => {
	if (err.code == 'ERR_NETWORK') {
		// 返回 ResponseResult 即恢复为 resolve
		const fallback: ResponseAny = {
			data: { 'offline': true },
			statusCode: 599,
			header: {},
			cookies: [],
			config: err.config
		}
		return fallback
	}
	return null
})
```

## 相关 API

- [Request 实例](./request-instance)（实例级拦截器）
- [RequestError](./type-request-error)
- [RequestConfig](./type-request-config)
- [拦截器](../guide/interceptors)（含重试 / loading / 业务拆包等实现路径）
