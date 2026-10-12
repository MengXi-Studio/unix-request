# ResponseResult

`request<T>` / 快捷方法成功时 resolve 的统一响应结构，对标 axios response schema。别名 `ResponseAny = ResponseResult<any>` 用于实例方法与拦截器等 `data` 以 `any` 流转的场景。

```uts
export type ResponseResult<T> = {
	data: T
	statusCode: number
	header: any
	cookies: Array<string>
	/** 发起该请求的最终合并配置（axios response.config 对标） */
	config: RequestConfig | null
}

/** 非泛型响应别名（实例方法 / 拦截器等 data 以 any 流转的场景） */
export type ResponseAny = ResponseResult<any>
```

## 字段

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `data` | `T`（泛型） | 响应数据。`dataType` 为 `json` 时已由原生 JSON.parse；空响应体（HEAD / 204）归一为空对象，契约保持非空 |
| `statusCode` | `number` | HTTP 状态码。默认仅 2xx 会 resolve（`validateStatus`），4xx / 5xx 走 reject |
| `header` | `any` | 响应 header（原生结构原样返回，库内不做键大小写规范化） |
| `cookies` | `Array<string>` | 响应 cookies |
| `config` | `RequestConfig \| null` | 发起该请求的**最终合并配置**（三级合并后的发送快照），可用于日志与调试 |

::: tip 为什么没有 statusText
原生 `uni.request` 成功回调不提供 statusText，且响应中的 `request` 引用不暴露——响应结构只保留原生真实存在的字段，不造空值占位。
:::

## 泛型说明

- `T` 仅作消费侧静态标注（`request<T>` 的泛型实参落到 `data` 上），响应数据实际以 `any` 流转，无运行时实例化需求；
- **实例方法与拦截器不提供泛型**：`RequestInstance` 各方法返回 `ResponseAny`，业务侧按需断言：

```uts
api.get('/users/1', null).then((res) => {
	const user = res.data as UTSJSONObject
})
```

- 拦截器 `onFulfilled` 的入参与返回值均为 `ResponseAny`，见[拦截器 API](./interceptors)。

## 示例

```uts
import { request } from '@/uni_modules/ux-request'

request<{ id: number, name: string }>({ url: '/api/users/1' }).then((res) => {
	console.log(res.statusCode)      // 200
	console.log(res.data.name)       // 已按泛型标注
	console.log(res.cookies.length)
	console.log(res.config.url)      // 最终发送的完整 URL
})
```

## 相关 API

- [request()](./request)
- [RequestConfig](./type-request-config)（`config` 字段的结构）
- [RequestError](./type-request-error)（`error.response` 挂载本结构）
- [发起请求](../guide/requests)
