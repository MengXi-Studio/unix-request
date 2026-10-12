# RequestQuickConfig

[快捷方法](./quick-methods)（`get` / `post` / `put` / `patch` / `del` / `head` / `options`）与实例快捷方法的请求级配置，对标 `axios.get(url, config)` 的 `config`。

```uts
export type RequestQuickConfig = {
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
	/** 请求体变换；提供即替换内置行为（data 可空，同 RequestConfig） */
	transformRequest?: ((data: any | null) => any) | null
	/** 响应体变换；提供即替换内置（内置为原样透传；参数可空同上） */
	transformResponse?: ((data: any | null) => any) | null
	/** 逃生舱：拿到原生 RequestTask（chunked 监听等高级场景） */
	onTask?: ((task: RequestTask) => void) | null
}
```

::: tip 为什么不含 url 字段
`url` 由快捷方法的第一个参数提供，类型上直接省去，避免调用方为满足 [RequestConfig](./type-request-config).url 必填而传占位值。除 `url` 外，字段与 `RequestConfig` 一一对应，语义完全一致。
:::

::: warning method 字段不会被透传
快捷方法的 method 由**方法名固定注入**（`post()` 一律发 POST），`config.method` 不参与合并——本类型保留该字段仅为与 `RequestConfig` 结构对齐，勿依赖它改写请求方法。
:::

## 字段

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `method` | `RequestMethod \| null` | （不透传） | 由快捷方法名决定，见上方警告 |
| `baseURL` | `string \| null` | 实例默认 | 请求级覆盖全局 baseURL |
| `params` | `UTSJSONObject \| null` | — | 查询参数，库内确定性编码进 url |
| `data` | `any \| null` | — | 请求级 data；与方法的 `data` 参数同域，**以方法参数为准**（POST/PUT/PATCH 系合并时方法参数覆盖本字段） |
| `header` | `UTSJSONObject \| null` | 实例默认 header | 浅合并，请求级同名键覆盖 |
| `timeout` | `number \| null` | 实例默认（`60000`） | 超时毫秒 |
| `dataType` | `string \| null` | 原生默认（`json`） | 透传原生 |
| `responseType` | `string \| null` | — | 透传原生 |
| `enableQuic` | `boolean \| null` | 原生默认 | 原生能力参数，全量透传 |
| `sslVerify` | `boolean \| null` | 原生默认 | 同上 |
| `withCredentials` | `boolean \| null` | 原生默认 | 同上 |
| `firstIpv4` | `boolean \| null` | 原生默认 | 同上 |
| `enableChunked` | `boolean \| null` | 原生默认 | 同上 |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | 实例默认（2xx） | 整体覆盖 |
| `cancelToken` | `CancelToken \| null` | `null` | 传入即可取消，见 [createCancelSource()](./create-cancel-source) |
| `transformRequest` | `((data: any \| null) => any) \| null` | 内置行为 | 提供即替换内置 |
| `transformResponse` | `((data: any \| null) => any) \| null` | 内置行为 | 提供即替换内置 |
| `onTask` | `((task: RequestTask) => void) \| null` | — | 原生 RequestTask 逃生舱 |

## 配套方法

- 顶层快捷方法（默认实例）：[快捷方法](./quick-methods)
- 实例快捷方法：[Request 实例](./request-instance)

## 示例

```uts
import { get } from '@/uni_modules/ux-request'

const header: UTSJSONObject = {}
header['Accept-Language'] = 'zh-CN'

get<Array<UTSJSONObject>>('/api/users', {
	params: { 'page': 1 },
	header: header,
	timeout: 10000
}).then((res) => {
	console.log(res.data.length)
})
```

## 相关 API

- [RequestConfig](./type-request-config)
- [快捷方法](./quick-methods)
- [RequestDefaults](./type-request-defaults)
