# 取消请求

unix-request 通过 `createCancelSource()` 提供取消能力（与 Axios 的 `CancelToken.source()` 同心智）：取消由**库主动调用原生 `task.abort()`**，语义 100% 确定，不依赖原生 errMsg 特征匹配。

## 基本用法

```uts
import { request, createCancelSource } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

const source = createCancelSource()

request<any>({
	url: '/api/search/list',
	params: { keyword: 'mengxi' } as UTSJSONObject,
	cancelToken: source.token
}).then((res) => {
	console.log('ok')
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code)   // 'ERR_CANCELED'
	console.log(e.errMsg) // '请求已取消：页面卸载'
})

// 在需要取消的时机（页面卸载、输入词变更等）
source.cancel('页面卸载')
```

- `source.token` 挂到 `RequestConfig.cancelToken`；
- `source.cancel(reason)` 取消该 token 关联的**全部进行中请求**，`reason` 会拼入 `errMsg`（`'请求已取消：' + reason`；传 `null` 时为 `'请求已取消'`）；
- 被取消的请求以 `ERR_CANCELED` reject。

## 发送前取消与飞行中取消

| 场景 | 行为 |
| --- | --- |
| 挂载 token 时**已取消**（先 `cancel` 后发请求） | 直接 reject `ERR_CANCELED`，**不发网络** |
| 请求**飞行中**取消 | 库主动 `task.abort()`，fail 归类 `ERR_CANCELED` |

```uts
const pre = createCancelSource()
pre.cancel('发送前取消')
request<any>({ url: '/api/http/method/get', cancelToken: pre.token }).catch((err) => {
	const e = err as RequestError
	console.log(e.code) // ERR_CANCELED（未发出任何网络请求）
})
```

## 一个 token 取消多个请求

token 可挂到多个请求上，`cancel` 一次性取消全部——适合「页面卸载时清空本页所有在途请求」：

```uts
const source = createCancelSource()
request<any>({ url: '/api/a', cancelToken: source.token })
request<any>({ url: '/api/b', cancelToken: source.token })
request<any>({ url: '/api/c', cancelToken: source.token })

source.cancel('页面卸载') // 三个请求同时收到 ERR_CANCELED
```

## token 是一次性的

::: warning 已取消的 token 不可复用
`cancel` 之后 token 置位（`canceled === true`，`reason` 记录原因），后续任何挂载该 token 的请求都会在发送前检查被拦截、直接 `ERR_CANCELED`。取消后需要再发请求，请**重新 `createCancelSource()`**（模式见[常见问题](./faq)）。
:::

token 的状态可读：

```uts
const source = createCancelSource()
source.token.canceled // false
source.cancel('x')
source.token.canceled // true
source.token.reason   // 'x'
```

## 边界与注意事项

- **取消请统一走 cancelToken 通道**。通过 `onTask` 拿到原生任务后手工 `abort()` 的 fail 会归类为 `ERR_NATIVE`（见[请求配置](./request-config)）；
- 业务自建的 token 对象（不经 `createCancelSource`）仅享受「发送前取消检查」，无确定性 abort 能力；
- 已到达终态（成功 / 失败）的请求会从取消注册表注销，`cancel` 不会误伤已完成请求；
- 取消与超时是两条独立路径：超时归类 `ERR_TIMEOUT`（见[错误处理](./error-handling)）。

API 签名见 [createCancelSource()](../api/create-cancel-source) 与类型 [CancelToken / CancelSource](../api/type-cancel)。
