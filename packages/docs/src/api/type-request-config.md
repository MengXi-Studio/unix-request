# RequestConfig

[request()](./request) 与实例 `request(config)` 的请求配置类型，对标 axios config。`url` 必填，其余字段全部可选。

```uts
export type RequestConfig = {
	/** 请求路径；相对路径拼接 baseURL（实例默认 < 请求级覆盖），http(s) 开头原样使用 */
	url: string
	/** 请求方法；不传或 null 使用实例默认（GET） */
	method?: RequestMethod | null
	/** baseURL 请求级覆盖 */
	baseURL?: string | null
	/** 查询参数：与 url 既有 query 合并，库内统一编码拼接 */
	params?: UTSJSONObject | null
	/** 请求体；GET/HEAD 的 UTSJSONObject 自动并入 query */
	data?: any | null
	/** 请求 header；与实例默认 header 浅合并（请求级同名键覆盖） */
	header?: UTSJSONObject | null
	/** 超时毫秒；不传或 null 使用实例默认（60000） */
	timeout?: number | null
	/** 响应 dataType（json / 其他），透传原生 adapter */
	dataType?: string | null
	/** 响应数据类型，透传原生（ArrayBuffer 场景：app-android 4.51+ / app-ios 4.61+） */
	responseType?: string | null
	/** 以下原生能力参数全量透传，本库不抹平，各端生效性见官方文档 */
	enableQuic?: boolean | null
	sslVerify?: boolean | null
	withCredentials?: boolean | null
	firstIpv4?: boolean | null
	enableChunked?: boolean | null
	/** 状态码校验；不传或 null 使用实例默认（2xx） */
	validateStatus?: ((statusCode: number) => boolean) | null
	/** 取消令牌；不传或 null 表示不可取消 */
	cancelToken?: CancelToken | null
	/** 请求体变换；提供即替换内置行为（data 可空：GET/HEAD 归一化后恒为 null） */
	transformRequest?: ((data: any | null) => any) | null
	/** 响应体变换；提供即替换内置（内置为原样透传） */
	transformResponse?: ((data: any | null) => any) | null
	/** 逃生舱：拿到原生 RequestTask（chunked 监听等高级场景） */
	onTask?: ((task: RequestTask) => void) | null
}
```

::: warning 「除 url 外全部可选」是刻意的空安全设计
uts-proxy 代理层会对**必填字段**生成非空强转，业务漏传即在原生端 NPE；只有**可选字段**才生成 null-safe 编码。因此本类型刻意只保留 `url` 一个必填字段，其余全部 `?` + `| null`——实现层统一对可空值判空兜底（三级合并回退实例默认 → 内置默认）。业务侧无须为「缺字段」做任何防御。
:::

## 字段

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | — | **必填**。相对路径拼接 baseURL（双侧斜杠容错），`http(s)` 开头原样使用 |
| `method` | `RequestMethod` | `'GET'` | 与入口常量 `DEFAULT_METHOD` 一致；`RequestDefaults` 不含 method，实例默认即内置默认 |
| `baseURL` | `string \| null` | 实例默认 | 请求级覆盖全局 baseURL；无 baseURL 且 url 相对 → `ERR_CONFIG` |
| `params` | `UTSJSONObject \| null` | — | 查询参数：与 url 既有 query 合并，库内确定性编码（键值 `encodeURIComponent`） |
| `data` | `any \| null` | — | 请求体；GET/HEAD 的 UTSJSONObject 自动并入 query 后不再透传原生 |
| `header` | `UTSJSONObject \| null` | 实例默认 header | 与实例默认 header 浅合并，请求级同名键覆盖 |
| `timeout` | `number \| null` | 实例默认（`60000`） | 入口常量 `DEFAULT_TIMEOUT = 60000`；请求级有值即覆盖 |
| `dataType` | `string \| null` | 原生默认（`json`） | `json` 时原生对返回数据做 JSON.parse，透传原生 |
| `responseType` | `string \| null` | — | 响应数据类型（ArrayBuffer 场景：app-android 4.51+ / app-ios 4.61+），透传原生 |
| `enableQuic` | `boolean \| null` | 原生默认 | 原生能力参数，全量透传不抹平，各端生效性见官方文档 |
| `sslVerify` | `boolean \| null` | 原生默认 | 同上 |
| `withCredentials` | `boolean \| null` | 原生默认 | 同上 |
| `firstIpv4` | `boolean \| null` | 原生默认 | 同上 |
| `enableChunked` | `boolean \| null` | 原生默认 | 同上（配合 `onTask` 监听 chunk） |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | 实例默认（2xx） | 请求级有值即整体覆盖；未通过时 4xx → `ERR_BAD_REQUEST` / 5xx → `ERR_BAD_RESPONSE` |
| `cancelToken` | `CancelToken \| null` | `null` | 传入即可取消，见 [createCancelSource()](./create-cancel-source) |
| `transformRequest` | `((data: any \| null) => any) \| null` | 内置行为 | 提供即替换内置（内置 = data 为 UTSJSONObject 且未显式设置 content-type 时补设 `application/json`） |
| `transformResponse` | `((data: any \| null) => any) \| null` | 内置行为 | 提供即替换内置（内置 = 原样透传） |
| `onTask` | `((task: RequestTask) => void) \| null` | — | 逃生舱：拿到原生 RequestTask，不影响库内取消登记 |

## 合并层级

请求级字段与实例默认按三级合并（**内置默认 < 实例 defaults < 请求级 RequestConfig**）：标量字段（method / timeout）请求级有值即覆盖；`header` 浅合并；回调字段（validateStatus / transform / cancelToken）请求级有值即整体覆盖。详见[请求配置](../guide/request-config)。

::: tip transformRequest 与 GET/HEAD
GET/HEAD 的 data 在归一化阶段已并入 query，`transformRequest` 收到的 `data` 恒为 `null`（M4 Kotlin 空安全约束，签名参数可空）——自定义 transform 内需判空。
:::

## 相关 API

- [RequestQuickConfig](./type-request-quick-config)（快捷方法的无 url 版本）
- [RequestDefaults](./type-request-defaults)
- [CancelToken / CancelSource](./type-cancel)
- [RequestConfig 配置项](../guide/request-config)
