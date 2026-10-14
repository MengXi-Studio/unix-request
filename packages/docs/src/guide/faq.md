# 常见问题

## del 为什么不叫 delete？

`delete` 是 UTS 保留字，不能作为导出函数名，因此 DELETE 快捷方法命名为 `del`（实例方法同理）。见[发起请求](./requests)。

## 泛型 T 只是静态标注吗？

是。`request<T>` / 快捷方法的泛型 `T` 仅为 `res.data` 提供消费方 TS 视图的静态类型标注，**运行时 data 以 `any` 流转**，没有运行时校验或实例化：

```uts
type UserInfo = { id: number, name: string }

// 即使服务端实际返回的不是 UserInfo，编译也不会失败——T 不参与运行时
get<UserInfo>('/api/user/1', null).then((res) => {
	console.log(res.data.name)
})
```

实例方法与拦截器中的响应统一为 `ResponseAny`（data 为 any），业务侧按需断言。见[响应结构](./response-schema)。

## 为什么 GET 请求的 data 跑到了 URL 上？

这是库的显式契约：GET/HEAD 的 `UTSJSONObject` data 自动编码并入 query（排在 params 之后），归一化后请求体恒为 `null`。原因是官方对「GET data → query」的隐式转换未明文编码规则，库内用确定性编码取代该行为，保证五端一致。连带影响：自定义 `transformRequest` 在 GET/HEAD 场景收到的 data 为 `null`，必须判空。见[参数与请求头](./params-and-headers)与[请求与响应转换](./transform)。

## ERR_CONFIG 什么时候抛？

**请求级与实例默认都没有 baseURL，而 url 是相对路径**时，归一化阶段 fail-fast 抛出（不发网络），errMsg 为「相对路径请求必须配置 baseURL」：

```uts
// 两个条件都不满足 → catch 收到 ERR_CONFIG
request<any>({ url: '/api/list' })
```

解决方案二选一：`configureRequest`（或 `createRequest` / `setConfig`）设置默认 baseURL；或请求级传 `baseURL` / 直接用绝对地址（`http(s)://` 开头不拼接 baseURL）。见[请求配置](./request-config)与[多实例与全局默认](./instances)。

## ERR_TIMEOUT / ERR_NETWORK 与 nativeErrCode 是什么关系？

库内归类是确定性映射：原生 `errCode 5` → `ERR_TIMEOUT`，`600003 / 600010` → `ERR_NETWORK`，其余 → `ERR_NATIVE`；`nativeErrCode` 永远是原生 errCode **原值透传**。业务按 code 做大类处理，需要更细的原生语义时读 `nativeErrCode`。注意各端表现差异：Web 端「不可路由地址 + 超时」可能归类为 `ERR_NETWORK`。见[错误处理](./error-handling)与[平台兼容性](./compatibility)。

## 拦截器里为什么拿到的 config.url 已是完整地址？

请求拦截器运行在**配置归一化之后**：此时 url 已拼接 baseURL、params 已编码进 url 并清空、GET/HEAD 的 data 已并入 query 且置 null。这是「归一化产物即发送快照」的设计——拦截器看到的就是即将发出的最终形态，也因此拦截器内改写 `params` 不会再生效（追加 query 请直接改 `config.url`）。见[请求流程原理](./request-flow)。

## 跨端 TS 类型提示怎么拿？

所有类型都从包入口 `import type` 引入，消费方的 TS 视图由 uts-proxy 自动生成，HBuilderX 对 `.uvue` / `.uts` 文件的补全即基于此：

```uts
import { request, get } from '@/uni_modules/mx-request'
import type { RequestConfig, RequestError, ResponseResult } from '@/uni_modules/mx-request'
```

泛型 T 的静态标注能力见[响应结构](./response-schema)。

## 如何取消请求后重建请求？

token 是一次性的：`cancel` 之后挂载该 token 的新请求会在发送前检查被直接 `ERR_CANCELED`。要「取消旧的、再发新的」（如搜索输入变更后重新搜索），每次都重新创建取消源：

```uts
import { get, createCancelSource } from '@/uni_modules/mx-request'
import type { RequestError } from '@/uni_modules/mx-request'

let current = createCancelSource()

function search(keyword: string): void {
	current.cancel('新搜索')
	current = createCancelSource()
	get<any>('/api/search', {
		params: { keyword: keyword } as UTSJSONObject,
		cancelToken: current.token
	}).catch((err) => {
		const e = err as RequestError
		if (e.code != 'ERR_CANCELED') {
			// 真正的网络异常才提示
		}
	})
}
```

取消机制的完整语义见[取消请求](./cancel)。
