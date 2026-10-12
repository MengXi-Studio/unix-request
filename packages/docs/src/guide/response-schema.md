# 响应结构

所有请求方法成功时 resolve 的都是同一个结构 `ResponseResult<T>`，对标 Axios 的 response schema。

## 字段总表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data` | `T` | 响应体。`dataType` 为 `json`（默认）时已由原生 JSON.parse；泛型 T 为静态标注（见下文） |
| `statusCode` | `number` | HTTP 状态码 |
| `header` | `any` | 响应头（原生原样返回，各端形态有差异，读取请判空） |
| `cookies` | `Array<string>` | 响应 cookies |
| `config` | `RequestConfig \| null` | 发起该请求的**最终合并配置**（发送快照，见[请求流程原理](./request-flow)） |

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestConfig } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', null).then((res) => {
	console.log('statusCode=' + res.statusCode.toString())
	console.log('data=' + JSON.stringify(res.data))
	const cfg = res.config
	if (cfg != null) {
		console.log('url=' + cfg.url) // 完整请求地址
	}
})
```

::: tip config 里有什么
`res.config` 是归一化产物：`url` 已是拼接完成的完整地址、`params` 已清空（编码进 url）、GET/HEAD 的 `data` 为 `null`、`header` 为合并结果。它是排查「请求到底发成了什么样」的第一现场。
:::

## 泛型 T 只是静态标注

`request<T>` / 快捷方法的泛型 `T` 仅为 `res.data` 提供消费方 TS 视图的静态类型标注，**运行时 data 以 `any` 流转**，不做运行时校验或转换：

```uts
type UserInfo = {
	id: number
	name: string
}

get<UserInfo>('/api/user/1', null).then((res) => {
	console.log(res.data.name) // 静态提示为 string；运行时是否真的是 string 由服务端决定
})
```

实例方法与拦截器中的响应类型为 `ResponseAny`（即 `ResponseResult<any>`），业务侧按需断言：

```uts
import { createRequest } from '@/uni_modules/ux-request'

const inst = createRequest(null)
inst.get('/api/user/1', null).then((res) => {
	const user = res.data as UserInfo
	console.log(user.name)
})
```

## data 的形态

`data` 的形态由请求配置决定：

| 场景 | data 形态 |
| --- | --- |
| 默认（`dataType: 'json'`） | 原生 JSON.parse 后的对象（通常为 `UTSJSONObject`） |
| `responseType: 'arraybuffer'` | `ArrayBuffer`（平台版本差异：app-android 4.51+ / app-ios 4.61+，见[平台兼容性](./compatibility)） |
| 空响应体（HEAD、204 等） | 归一为**空对象**（非 `null`），保证 `data` 非空契约 |
| 其他 `dataType` | 透传原生的解析结果 |

::: warning 非 JSON 响应体的平台差异
`dataType` 为 `json` 而服务端返回非合法 JSON 时，App 端原生解析失败会走 fail（归类 `ERR_NATIVE`，`nativeErrCode` 为 JSON 解析类错误码）；H5 端 dev 模式控制台可能打印 `SyntaxError`，属运行时噪音、请求本身正常，详见[平台兼容性](./compatibility)。
:::

## contentType 与 data 形态的关系

响应侧的解析由 `dataType` / `responseType` 控制，**与服务端的 `Content-Type` 无耦合**——本库不根据响应头猜测 data 形态，一切以透传原生的解析结果为准。若业务需要按服务端 `Content-Type` 分支处理，可在响应拦截器或 `transformResponse` 中读取 `res.header` 自行判断（见[拦截器](./interceptors)与[请求与响应转换](./transform)）。

## statusCode 与成败的关系

响应能进入 `then`，说明 `validateStatus` 校验已通过（默认 2xx）。因此 `res.statusCode` 主要用于：同一成功区间内的细分逻辑（如 201 / 202 差异化处理），或自定义校验区间后的区间判断。4xx / 5xx 一律在 `catch` 中以 `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` 出现并携带响应原文，见[错误处理](./error-handling)。

完整类型定义见 API 文档 [ResponseResult](../api/type-response)。
