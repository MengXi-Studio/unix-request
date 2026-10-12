# 拦截器

拦截器是 unix-request 对标 Axios 的核心能力：在请求发出前统一加工配置，在响应返回后统一加工结果或错误。默认实例与 `createRequest` 实例各自拥有独立的拦截器注册表。

## 注册与移除

```uts
import { useRequestInterceptor, useResponseInterceptor, ejectInterceptor } from '@/uni_modules/ux-request'

const reqId = useRequestInterceptor((config) => {
	// 请求拦截
	return config
})
const resId = useResponseInterceptor((res) => {
	// 响应成功路径
	return res
}, null) // 第二参为错误路径，可传 null 占位

ejectInterceptor(reqId) // 按 id 移除
ejectInterceptor(resId)
```

规则：

- 注册返回**自增 id**（请求 / 响应共用一个计数），`ejectInterceptor(id)` 按 id 移除；
- 多枚拦截器按**注册顺序**依次执行；
- `useResponseInterceptor` 接收双参：`onFulfilled`（成功路径，可传 `null` 占位）与 `onRejected`（错误路径，可传 `null`）；
- 注册表挂在实例上：默认实例的拦截器不影响 `createRequest` 创建的实例，反之亦然。

API 签名见 [拦截器 API](../api/interceptors)。

## 请求拦截器

`onFulfilled` 接收配置、**必须返回改写后的 config**，返回值逐层传递给下一个拦截器：

```uts
useRequestInterceptor((config) => {
	const h = config.header
	if (h == null) {
		const fresh: UTSJSONObject = {}
		fresh['Authorization'] = 'Bearer token'
		config.header = fresh
	} else {
		h['Authorization'] = 'Bearer token'
	}
	return config
})
```

::: warning 你拿到的是「归一化后」的配置
请求拦截器运行在配置归一化**之后**，所以此刻：

- `config.url` 已是拼接 baseURL 的**完整地址**；
- `config.params` 已被清空（编码进了 url）；
- GET/HEAD 请求的 `config.data` 恒为 `null`（已并入 query）。

改写 `params` 不会再被编码进 url——追加 query 请直接改 `config.url`。完整管线见[请求流程原理](./request-flow)。
:::

## 响应拦截器：成功路径

`onFulfilled` 收到 `ResponseAny`，返回值继续向后传递（可用于统一打日志、拆包、字段归一）：

```uts
useResponseInterceptor((res) => {
	let url = 'config-null'
	const cfg = res.config
	if (cfg != null) {
		url = cfg.url
	}
	console.log('[res] ' + res.statusCode.toString() + ' ' + url)
	return res // 务必返回响应，否则链路拿不到结果
}, null)
```

## 响应拦截器：错误链三条路径

`onRejected` 收到统一错误 [RequestError](../api/type-request-error)，按返回值分三条路径（Axios 同款语义）：

| 返回值 | 行为 |
| --- | --- |
| `ResponseResult`（响应对象） | **恢复**：转 resolve，后续拦截器回到成功态 |
| `RequestError`（错误对象） | **换错**：以新错误继续 reject |
| `null` | **放行**：携带原错误继续 reject 给调用方 |

::: warning UTS 写法约束
页面侧 `onRejected` 回调的返回类型必须显式声明为 `any | null`（写成对象联合类型会被 HBuilderX 转译为无返回值期望，`return` 即编译错误）：

```uts
useResponseInterceptor(null, (err: RequestError): any | null => {
	// ...
	return null
})
```
:::

### 路径一：恢复（错误兜底转成功）

```uts
import type { RequestError, ResponseAny } from '@/uni_modules/ux-request'

const recId = useResponseInterceptor(null, (err: RequestError): any | null => {
	if (err.code == 'ERR_BAD_REQUEST') {
		// 构造兜底响应：header 必须给空对象，不可给 null
		const emptyHeader: UTSJSONObject = {}
		const fallback: ResponseAny = {
			data: 'recovered-from-404',
			statusCode: 599,
			header: emptyHeader,
			cookies: [] as Array<string>,
			config: err.config
		}
		return fallback // 调用方 then 正常收到，res.data === 'recovered-from-404'
	}
	return null // 其余错误放行
})
```

### 路径二：换错（错误转换）

```uts
import type { RequestError } from '@/uni_modules/ux-request'

const mapId = useResponseInterceptor(null, (err: RequestError): any | null => {
	const converted: RequestError = {
		code: 'ERR_CANCELED',
		errSubject: 'unix-request',
		errMsg: '业务转换后的错误',
		nativeErrCode: null,
		statusCode: null,
		config: err.config,
		response: null
	}
	return converted // 调用方 catch 收到 converted
})
```

### 路径三：放行

```uts
useResponseInterceptor(null, (err: RequestError): any | null => {
	report(err) // 自定义上报后放行，调用方照常 catch
	return null
})
```

::: tip 三条路径的判别机制
库内以 `errSubject === 'unix-request'` 契约值判别返回值是错误还是响应（常量 `REQUEST_ERR_SUBJECT`）。因此**换错时构造的 RequestError 请保持结构完整**（errSubject 沿用 `'unix-request'`）；恢复路径构造的响应对象注意 `header` 必须给空对象而非 `null`。
:::

## 进错误链的不只是网络错误

按 Axios 语义，以下**前段错误**同样会进入响应拦截器的 `onRejected`：

- 配置归一化失败（`ERR_PARAM` / `ERR_CONFIG`，此时 `err.config` 为原始请求级配置）；
- 请求拦截器执行异常（库内捕获转 `ERR_NATIVE`）；
- `transformRequest` 执行异常（`ERR_NATIVE`）；
- 发送前取消（token 已取消，`ERR_CANCELED`）。

因此「全局错误上报」只需注册一次 `onRejected`，即可覆盖请求全生命周期失败。反过来，拦截器内抛出的任何异常也会被库捕获并转 `ERR_NATIVE`，不会中断链路。

## 实战配方：统一注入 token + 统一错误上报

```uts
import { useRequestInterceptor, useResponseInterceptor } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['token'] = getToken() // 业务侧实现
	}
	return config
})

useResponseInterceptor(null, (err: RequestError): any | null => {
	reportToServer(err.code, err.errMsg) // 业务侧实现
	return null // 放行给业务侧 catch
})
```

更多玩法（token 无感刷新、loading 计数）思路相同：请求拦截器注入、`onRejected` 恢复 / 放行组合。
