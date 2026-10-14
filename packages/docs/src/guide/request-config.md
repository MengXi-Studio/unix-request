# 请求配置

一次请求的行为由 `RequestConfig`（`request` 主入口）或 `RequestQuickConfig`（快捷方法，无 url 字段）描述。两者除 url 外字段一一对应，本章逐个说明。

## 字段总表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string`（必填） | 请求路径。相对路径拼接 baseURL；`http://` / `https://` 开头原样使用 |
| `method` | `RequestMethod \| null` | 请求方法；不传或 `null` 使用实例默认（GET）。快捷方法中该字段不生效（method 由方法名固定注入） |
| `baseURL` | `string \| null` | 请求级覆盖实例默认 baseURL |
| `params` | `UTSJSONObject \| null` | 查询参数，与 url 既有 query 合并，库内统一编码（见[参数与请求头](./params-and-headers)） |
| `data` | `any \| null` | 请求体；GET/HEAD 的 `UTSJSONObject` 自动并入 query |
| `header` | `UTSJSONObject \| null` | 请求 header，与实例默认 header 浅合并（请求级同名键覆盖） |
| `timeout` | `number \| null` | 超时毫秒；不传或 `null` 使用实例默认（60000） |
| `dataType` | `string \| null` | 响应 dataType（`json` 时原生做 JSON.parse），透传原生 |
| `responseType` | `string \| null` | 响应数据类型，透传原生（ArrayBuffer 场景：app-android 4.51+ / app-ios 4.61+） |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | 状态码校验；不传或 `null` 使用实例默认（2xx 视为成功） |
| `cancelToken` | `CancelToken \| null` | 取消令牌；不传或 `null` 表示不可取消（见[取消请求](./cancel)） |
| `transformRequest` | `((data: any \| null) => any) \| null` | 请求体变换，提供即替换内置（见[请求与响应转换](./transform)） |
| `transformResponse` | `((data: any \| null) => any) \| null` | 响应体变换，提供即替换内置（内置为原样透传） |
| `onTask` | `((task: RequestTask) => void) \| null` | 逃生舱：拿到原生 RequestTask（见下文） |
| `enableQuic` / `sslVerify` / `withCredentials` / `firstIpv4` / `enableChunked` | `boolean \| null` | 原生能力参数，全量透传不抹平（见下文） |

::: tip 可选字段是刻意设计
除 `url` 外全部字段均可选。这是 UTS 插件的实战红线：插件代理层对必填字段生成非空强转，业务漏传即空指针崩溃；全部可选 + 库内判空兜底，保证调用侧永远可以只写 `{ url: '/x' }`。
:::

## 可空语义：不传或 null 使用实例默认

所有可选字段的一致语义：**不传或显式传 `null`，表示使用实例默认**（实例默认也没有则回退内置默认）。显式传 `null` 与不传等价，方便业务在「动态配置」场景统一写法：

```uts
import { request } from '@/uni_modules/mx-request'

request<any>({
	url: '/api/list',
	method: null,      // 使用实例默认（GET）
	timeout: null      // 使用实例默认（60000 或 configureRequest 设置值）
})
```

## 三级合并

合并顺序严格为：**内置默认 → 实例默认（configureRequest / createRequest / setConfig）→ 请求级 RequestConfig**。

| 配置项 | 内置默认 | 合并规则 |
| --- | --- | --- |
| `method` | `GET` | 请求级有值即覆盖 |
| `timeout` | `60000` 毫秒 | 请求级有值即覆盖 |
| `validateStatus` | 2xx 通过（`>= 200 && < 300`） | 回调整体覆盖，不合并 |
| `baseURL` | 无（此时相对路径请求 fail-fast） | 请求级覆盖实例默认 |
| `header` | 无 | **浅合并**：实例默认键被请求级同名键覆盖，其余键保留 |

```uts
import { request } from '@/uni_modules/mx-request'

// 允许 3xx 也算成功（覆盖默认 2xx 校验）
request<any>({
	url: '/api/redirect-check',
	validateStatus: (statusCode: number): boolean => {
		return statusCode >= 200 && statusCode < 400
	}
})
```

> `RequestDefaults` 与实例默认的完整语义见[多实例与全局默认](./instances)与 API 文档 [RequestDefaults](../api/type-request-defaults)。

## 原生透传参数

以下字段**全量透传 `uni.request`，本库不做抹平**，各端是否生效以[官方文档](https://doc.dcloud.net.cn/uni-app-x/api/request.html)为准：

- `enableQuic`：QUIC 传输
- `sslVerify`：SSL 证书校验
- `withCredentials`：跨域凭证
- `firstIpv4`：优先 IPv4
- `enableChunked`：分块传输（配合 `onTask` 监听 chunk）

同理，`dataType` / `responseType` 也为原样透传。`responseType: 'arraybuffer'` 存在平台版本差异（app-android 4.51+ / app-ios 4.61+），详见[平台兼容性](./compatibility)。

## onTask：原生任务逃生舱

`onTask` 在请求发出后回调原生 `RequestTask`，用于本库未封装的高级场景（chunked 监听、响应头监听等）：

```uts
import { request } from '@/uni_modules/mx-request'

request<any>({
	url: '/api/stream',
	enableChunked: true,
	onTask: (task: RequestTask): void => {
		// task.onChunkReceived / task.onHeadersReceived 等原生能力
	}
})
```

::: warning 手工 abort 的归类
可以通过 `onTask` 拿到的任务手工 `abort()`，但该路径引发的 fail 会归类为 `ERR_NATIVE`（非确定性取消）。**取消请统一走 [cancelToken](./cancel) 通道**，语义 100% 确定。
:::

## 配置的最终归宿：发送快照

归一化之后，库内持有一份「发送快照」：url 已拼接完整、params 已编码清空、header 已合并。`response.config` / `error.config` 持有的就是它——排查「请求到底发成了什么样」时直接查看即可，原理详见[请求流程原理](./request-flow)。

完整类型定义见 API 文档 [RequestConfig](../api/type-request-config) 与 [RequestQuickConfig](../api/type-request-quick-config)。
