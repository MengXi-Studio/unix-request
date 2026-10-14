# 请求与响应转换

`transformRequest` / `transformResponse` 是请求级转换钩子（对标 Axios 同名配置）：**提供即替换内置行为**，不提供则使用内置默认。

## 内置行为总表

| 场景 | 内置行为 |
| --- | --- |
| `transformRequest` 未提供 | data 原样透传原生（序列化由原生 adapter 处理）；data 为 `UTSJSONObject` 且未显式设置 `content-type` 时补设 `application/json` |
| `transformRequest` 已提供 | 执行业务变换，替换内置；变换结果若为 `UTSJSONObject` 同样触发 Content-Type 补设 |
| `transformResponse` 未提供 | 响应体**原样透传**（JSON 解析由原生 `dataType: 'json'` 完成） |
| `transformResponse` 已提供 | 执行业务变换，替换内置透传 |

::: tip 序列化不重造
请求体序列化（JSON.stringify 等）完全依赖原生 adapter，库内不重造。库内唯一主动做的是 Content-Type 补设：保证 `UTSJSONObject` 请求体默认以 `application/json` 发出；业务显式设置的 `content-type`（大小写不敏感识别）不会被覆盖。请求体为 `string` / `ArrayBuffer` 时 Content-Type 由业务自管。
:::

## transformRequest

提供即替换内置，适合统一加工请求体（附加时间戳、改形态等）：

```uts
import { post } from '@/uni_modules/mx-request'

post<any>('/api/user/create', { name: 'mengxi' } as UTSJSONObject, {
	transformRequest: (data: any | null): any => {
		if (data == null) {
			return data
		}
		// 示例：给 UTSJSONObject 请求体统一附加时间戳
		if (data instanceof UTSJSONObject) {
			const obj = data as UTSJSONObject
			obj['_ts'] = Date.now()
			return obj
		}
		return data
	}
})
```

::: warning 参数必须可空，且 GET/HEAD 恒为 null
回调签名是 `(data: any | null) => any`，参数类型**必须写 `any | null`**（写成 `any` 会因函数参数逆变在 Kotlin 端编译报错）。

GET/HEAD 请求的 data 在归一化阶段已并入 query，**transformRequest 收到的 data 恒为 `null`**——transform 内务必判空，否则自定义逻辑会在 GET 请求上踩空：

```uts
transformRequest: (data: any | null): any => {
	if (data == null) {
		return data
	}
	// 仅处理非空请求体
	return data
}
```
:::

## transformResponse

内置为原样透传，提供即替换。典型用途是「业务拆包」——假设服务端统一返回 `{ code, msg, result }`：

```uts
import { request } from '@/uni_modules/mx-request'

request<any>({
	url: '/api/user/1',
	transformResponse: (data: any | null): any => {
		if (data instanceof UTSJSONObject) {
			const obj = data as UTSJSONObject
			return obj['result'] ?? obj
		}
		return data
	}
}).then((res) => {
	// res.data 已是拆包后的 result
})
```

两个行为边界：

- `transformResponse` 在 `validateStatus` 校验**之后**执行：HTTP 错误（4xx / 5xx）直接 reject，不经过 transformResponse；
- transform 内抛出的异常被库捕获转 `ERR_NATIVE`（errMsg 为「transformResponse 执行异常」），不会产生未捕获崩溃；`transformRequest` 异常同理。

## transform 与拦截器的分工

| 关注点 | 用 transform | 用拦截器 |
| --- | --- | --- |
| 请求体 / 响应体的**数据形态**加工 | ✅ | — |
| 请求头注入、URL 改写 | — | ✅ |
| 需要读取整份配置（header / url） | — | ✅ |
| 错误恢复 / 换错 / 放行 | — | ✅ |

transform 只管「数据」，且是请求级一次性配置；横切所有请求的逻辑请用[拦截器](./interceptors)。
