# 快速开始

本篇带你从零跑通第一个请求：配置全局默认 → 发起 GET → 处理响应与错误。假设你已完成[安装](./installation)。

## 第一步：配置全局默认

推荐在 `App.uvue` 的 `onLaunch` 中通过 `configureRequest` 设置默认实例的全局默认（baseURL / 超时 / 默认 header）：

```uts
// App.uvue <script setup lang="uts"> 内
import { configureRequest } from '@/uni_modules/ux-request'

onLaunch(() => {
	const header: UTSJSONObject = {}
	header['x-app'] = 'my-app'
	configureRequest({
		baseURL: 'https://request.dcloud.net.cn',
		timeout: 15000,
		header: header,
		validateStatus: null
	})
})
```

> `RequestDefaults` 的 4 个字段（baseURL / timeout / header / validateStatus）都可为 `null`：为 `null` 表示沿用内置默认（GET / 60000 毫秒 / 无 header / 2xx 校验）。详见[多实例与全局默认](./instances)。

## 第二步：发起请求

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', null)
	.then((res) => {
		console.log('statusCode=' + res.statusCode.toString())
		console.log('data=' + JSON.stringify(res.data))
	})
	.catch((err) => {
		const e = err as RequestError
		console.log('code=' + e.code + ' errMsg=' + e.errMsg)
	})
	.finally(() => {
		// 无论成败都会执行（收起 loading 等）
	})
```

要点：

- 相对路径 `/api/http/method/get` 自动拼接全局 `baseURL`；
- `.catch` 收到的载荷是统一错误结构，UTS 中以 `err as RequestError` 断言后按 `code` 分类处理；
- HTTP 4xx / 5xx 会直接 reject（`ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE`），**无需手工判断 `statusCode`**——成功回调里的数据一定是「业务可用」的响应。

## 带类型与参数的请求

```uts
type UserInfo = {
	id: number
	name: string
}

get<UserInfo>('/api/user/1', {
	params: { withDetail: true } as UTSJSONObject
}).then((res) => {
	console.log(res.data.name) // 泛型 T 提供静态提示：编译器知道 data 是 UserInfo
})
```

> 泛型 `T` 仅为 `res.data` 提供静态类型标注，运行时 data 以 `any` 流转，详见[响应结构](./response-schema)。

## POST 请求

```uts
import { post } from '@/uni_modules/ux-request'

post<any>('/api/user/create', { name: 'mengxi', role: 'admin' } as UTSJSONObject, null)
	.then((res) => {
		console.log('statusCode=' + res.statusCode.toString())
	})
```

- `data` 原样透传 `uni.request`，请求体序列化由原生处理；
- data 为 `UTSJSONObject` 且未显式设置 `content-type` 时，库内自动补设 `application/json`（详见[请求与响应转换](./transform)）。

## 完整示例

把三步合在一个页面里（与 playground 同款结构，可直接运行）：

```uts
import { get, configureRequest } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

configureRequest({
	baseURL: 'https://request.dcloud.net.cn',
	timeout: 15000,
	header: null,
	validateStatus: null
})

get<any>('/api/http/method/get', { params: { from: 'quick-start' } as UTSJSONObject })
	.then((res) => {
		console.log('ok statusCode=' + res.statusCode.toString())
	})
	.catch((err) => {
		const e = err as RequestError
		console.log('fail code=' + e.code + ' errMsg=' + e.errMsg)
	})
```

## 下一步

- 了解七种快捷方法与 `request` 主入口的全部能力 → [发起请求](./requests)
- 了解每个配置字段的确切语义与三级合并 → [请求配置](./request-config)
- 出错时拿到什么、怎么分类处理 → [错误处理](./error-handling)
