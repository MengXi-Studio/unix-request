# unix-request · 对标 Axios 的 UTS 请求库（uni-app x）设计文档

|              |                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态         | v0.7（M4 Android dex 云打包验证通过：compileReleaseKotlin 零错误，泛型导出形态定稿为具名 `export function apiName<T>`；Web 15/15 运行时验证维持通过；微信端矩阵待开发者工具人工实测、Android 真机矩阵待真机、鸿蒙 / iOS 因环境限制延后） |
| 日期         | 2026-10-12                                                                                                                                                                                                                         |
| 工程惯例参照 | [unix-utils](https://github.com/MengXi-Studio/unix-utils) v0.8（标准 uni_modules UTS 插件形态 / monorepo / const 模式入口 / interface.uts 对外声明 / 中文注释）                                                                    |
| 事实依据     | [uni-app x 官方 uni.request 文档](https://doc.dcloud.net.cn/uni-app-x/api/request.html)（2026-10 查证）、[Axios 官方文档](https://axios-http.com/docs/intro)（2026-10 查证）、unix-utils v0.8 实战红线（LESSONS_LEARNED 19/21 条） |

---

## 1. 来源

### 1.1 项目定位

`unix-request` 是 MengXi-Studio 工具矩阵的第三员（`unix-router` 路由 / `unix-utils` 便利工具 / `unix-request` 网络请求），**核心功能体系对标 Axios**，为 uni-app x 提供 UTS 原生请求库。工程范式与 `unix-utils`
v0.8 完全一致：

- **标准 uni_modules UTS 插件**：`utssdk/` 官方目录结构 + `interface.uts` 对外声明 + const 模式入口，插件市场 + npm 双轨分发；
- **UTS 源分发**：由 uni-app x 编译链按目标平台现场编译（Web / 小程序 → JS，Android → Kotlin，iOS → Swift）；
- **强类型 UTS**：`type` 定义对象类型、字面量联合类型、无 `undefined`、严格条件布尔，遵循全部 UTS 编译约束；
- **统一依赖底座**：底层唯一依赖 `uni.request`（官方原生实现，角色对标 Axios 的 adapter），库内预留 adapter 收敛点但 v1 不开放替换。

### 1.2 uni.request 现状（事实，均来自官方文档 2026-10 查证）

**① API 可用版本**

| Web | 微信小程序 | 支付宝小程序 | Android | iOS  | HarmonyOS |
| --- | ---------- | ------------ | ------- | ---- | --------- |
| 4.0 | 4.41       | 5.31         | 3.91    | 4.11 | 4.61      |

**② RequestOptions 参数**（与本库相关的全部参数）

| 参数                                                                           | 类型            | 默认     | 说明                                                                                            |
| ------------------------------------------------------------------------------ | --------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `url`                                                                          | `string`        | 必填     | 服务器接口地址                                                                                  |
| `data`                                                                         | `any`           | `null`   | 请求参数；**app-android 只接受 `UTSJSONObject` / `string`**（4.51 起 ArrayBuffer；iOS 4.61 起） |
| `header`                                                                       | `UTSJSONObject` | `null`   | 请求 header（不能设置 Referer）                                                                 |
| `method`                                                                       | `string`        | `"GET"`  | GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS                                              |
| `timeout`                                                                      | `number`        | `60000`  | 超时（ms）                                                                                      |
| `dataType`                                                                     | `string`        | `"json"` | json 时对返回数据做 JSON.parse                                                                  |
| `responseType`                                                                 | `string`        | -        | 响应数据类型                                                                                    |
| `enableQuic` / `sslVerify` / `withCredentials` / `firstIpv4` / `enableChunked` | `boolean`       | `false`  | 各端生效性有差异                                                                                |
| `success` / `fail` / `complete`                                                | 回调            | `null`   | 回调式 API；返回 `RequestTask`                                                                  |

**③
RequestSuccess**：`data: T`（**泛型**，官方框架 API 已使用泛型——编译器/类型系统层面泛型可用，但插件导出须经 uts-proxy 代理生成，仍需 spike 验证，见 Q10）、`statusCode: number`、`header: any`、`cookies: Array<string>`。

**④ RequestFail errCode 合法值**：`5` 超时 / `1000` 服务端系统错误 / `100001–100003` JSON 解析类 / `600003` 网络中断 / `600008` data 参数类型不合法 / `600009` URL 格式不合法 / `600010` Cronet 模块加载失败 / `602001`
request 系统错误。另含 `errSubject` / `data` / `cause` / `errMsg`。

**⑤ RequestTask**：`abort()` 中断请求；`onChunkReceived` / `onHeadersReceived` 等监听（4.71+）。

**⑥ 关键行为特征（封装动机所在）**

- **4xx / 5xx 仍走 `success` 回调**：HTTP 错误不是失败，`statusCode` 只是数据字段，业务每次都要手工判断；
- **回调式 API**：无官方 Promise / 实例化 / 拦截器形态；
- **无 baseURL / params / 实例 / 默认配置层级**：官方 `RequestOptions` 只有 `data` 没有 `params` 字段；GET data → query 的转换为 uni-app 惯例行为（hello uni-app x 官方示例含「检测query」专项测试佐证），**但 uni-app
  x 文档未明文编码规则**（编码方式 / 嵌套对象处理 / 各端一致性均无承诺）——本库 `params` 因此由库内确定性编码，不依赖该隐式行为（3.5）；
- **header 键大小写**：hello uni-app x 官方示例含「检测 header 键是否为小写」专项测试，提示原生可能对 header 键做小写化——库内不做大小写规范化（v1），playground 实测矩阵覆盖；
- **错误语义分散**：网络层错误（errCode 5 / 600003 / …）与 HTTP 层错误（statusCode 404 / 500）两套体系，无统一错误结构。

### 1.3 Axios 核心功能体系 → UTS 映射表（本设计的功能边界总纲）

| Axios 能力                                                                                          | 对标决策                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Promise API + 方法别名（get/post/put/patch/delete/head/options）                                    | ✅ 全保留（3.1）                                                                                                                    |
| `axios.create(config)` 多实例 + 默认实例导出                                                        | ✅ `createRequest` 多实例 + 模块默认实例（3.2；跨代理形态 M2 spike，见 Q2）                                                         |
| 配置三级合并（defaults < instance.defaults < request config）                                       | ✅ 同语义实现（3.6）                                                                                                                |
| 请求 / 响应拦截器（多枚、有序、可 eject、可异步）                                                   | ✅ 语义全对标，v1 仅同步（3.4 / Q4）                                                                                                |
| `transformRequest` / `transformResponse`                                                            | ✅ 进 v1，config 级提供即替换内置行为（3.5）                                                                                        |
| 自动序列化 + 自动 Content-Type                                                                      | ✅ 序列化依赖原生 adapter（data 透传不重造），库内补默认 `content-type: application/json`；响应 parse 依赖原生 dataType=json（3.5） |
| `params` 查询参数（paramsSerializer 开放自定义）                                                    | ✅ `params` 进 v1（官方无此字段，库内确定性编码）；`paramsSerializer` 自定义不进 v1                                                 |
| AxiosError（code 体系 + config / response 挂载）                                                    | ✅ `RequestError` 全对标（3.3 / Q3）                                                                                                |
| 取消：AbortController / CancelToken（cancel → ERR_CANCELED）                                        | ✅ UTS 形态 `createCancelSource()`，库内确定性 abort（3.7 / Q6）                                                                    |
| `validateStatus`（默认 2xx） / `timeout`                                                            | ✅ 原样对标                                                                                                                         |
| `getUri(config)`                                                                                    | ✅                                                                                                                                  |
| Response schema（data / status / headers / config / request）                                       | ✅ data / statusCode / header / cookies / config（statusText 原生无；request 引用不暴露）                                           |
| 原生能力参数（responseType / enableQuic / sslVerify / withCredentials / firstIpv4 / enableChunked） | ✅ RequestConfig 显式字段全量透传（本库不抹平、文档标注各端差异）                                                                   |
| `onUploadProgress` / `onDownloadProgress`                                                           | ✗ 非目标（uni.request 无进度能力；uploadFile / downloadFile 后续版本）                                                              |
| AxiosHeaders 类（规范化读写）                                                                       | ✗ v1 用 UTSJSONObject 直传 + 浅合并，不做键大小写规范化                                                                             |
| `auth`（Basic）/ proxy / maxRedirects / maxContentLength                                            | ✗ 非目标（原生无对应能力或场景极少）                                                                                                |
| `axios.all` / `axios.spread`                                                                        | ✗ UTS 直接 `Promise.all`                                                                                                            |
| adapter 切换（xhr / http / fetch）                                                                  | ✗ v1 唯一底座 uni.request；库内以单一 `sendRequest` 函数收敛调用点，为后续 adapter 预留                                             |

### 1.4 抹平边界（两层模型）

- **第一层：编排层**（Axios 功能体系全量对标：实例 / 拦截器 / transform / params / 统一错误 / 取消 / 配置合并）——本库**全消除**；
- **第二层：网络栈层**（QUIC / chunked / cookie / DNS / 压缩 / 请求体序列化）——`uni.request` 即官方原生 adapter，**原样透传不重造**。网络层天然同源，五端差异仅来自原生 API 本身，不在库内抹平、原样暴露并文档标注。

### 1.5 继承的实战红线（unix-utils v0.8 已验证，设计期即规避）

1. **options 除真正必填字段外一律声明可选**（`?`）——uts-proxy 代理层对必填字段生成非空强转，业务漏传即 NPE（LESSONS 21）；
2. **实现层函数一律加 `Impl` 后缀**，内部同语义常量加 `BUILTIN_` 前缀——插件全部 `.uts` 合并同一 Kotlin package，同名 top-level 符号触发导出符号静默重整（LESSONS 19）；
3. **入口声明模式**：非泛型 API 用官方 const 模式（`export const api: ApiType = function (...) {}`）；**泛型 API 必须用具名 `export function apiName<T>(...)` 声明**（M4 云打包实证：const 绑定的泛型函数字面量转译为 Kotlin 匿名 `fun <T>` 被 Kotlin 禁止，顶层具名 `fun <T>` 合法，见 3.11）。对外类型全部内联声明在 `interface.uts`（转发链对 uts-proxy 不可见）；
4. **枚举无法跨 uts-proxy 边界**，method / 错误 code 一律字面量联合类型；
5. **平台判定必须用条件编译**，不依赖运行时 API 字符串匹配（LESSONS 14）。

---

## 2. 设计目标与非目标

**目标**

- G1 **Axios 功能体系对标**：1.3 映射表内所有 ✅ 项落地，API 心智与 Axios 对齐（实例 / 拦截器 / transform / params / 统一错误 / 取消）；
- G2 **Promise 式 API**：`request(config)` 返回 `Promise<ResponseResult>`，泛型支持按 M2 spike 结论定（Q10）；
- G3 **实例体系**：默认实例开箱即用 + `createRequest` 多实例（不同 baseURL / 默认配置隔离）；
- G4 **拦截器链**：请求 / 响应拦截器，多枚、有序、可 eject，错误可恢复 / 可转换；
- G5 **统一错误结构**：`RequestError` 对标 AxiosError（code 体系 + config / response 挂载 + 原生 errCode 不丢失）；
- G6 **强类型 UTS 五端编译**：Android / iOS / Web / 微信 / 鸿蒙通过，遵循 1.5 全部红线；
- G7 **工程对齐 unix-utils**：monorepo `packages/core` + `packages/playground`、sync 脚本、docs 设计文档、中文注释。

**非目标**

- 不重造网络栈（QUIC / chunked / cookie / 请求体 JSON 序列化一律透传原生 adapter）；
- v1 不含 `uni.uploadFile` / `uni.downloadFile` 封装、上传下载进度、重试、loading 指示器、token 无感刷新（拦截器实现路径写入文档）；
- 不做 AxiosHeaders 完整类、auth Basic、proxy、paramsSerializer 自定义、adapter 可替换（各自理由见 1.3 / 后续版本评估）；
- 不内置业务 code 拆包（HTTP 层与业务层分离，响应拦截器实现，文档给示例）。

---

## 3. 功能点

### 3.1 双层 API：默认实例 + 多实例（对标 axios 默认导出 + axios.create）

```ts
/* ============ 默认实例（模块级单例，开箱即用；泛型 API 用具名 export function 声明，见 1.5-3） ============ */
request<T>(config: RequestConfig): Promise<ResponseResult<T>>
get<T>(url: string, config: RequestQuickConfig | null): Promise<ResponseResult<T>>
post<T>(url: string, data: any | null, config: RequestQuickConfig | null): Promise<ResponseResult<T>>
put<T>(url: string, data: any | null, config: RequestQuickConfig | null): Promise<ResponseResult<T>>
patch<T>(url: string, data: any | null, config: RequestQuickConfig | null): Promise<ResponseResult<T>>
del<T>(url: string, config: RequestQuickConfig | null): Promise<ResponseResult<T>>     // delete 为 UTS 保留字，别名 del
head<T>(url: string, config: RequestQuickConfig | null): Promise<ResponseResult<T>>
options<T>(url: string, config: RequestQuickConfig | null): Promise<ResponseResult<T>>
getUri(config: RequestConfig | null): string                                  // 构建完整 URL（含 params 编码；非泛型，const 模式）
useRequestInterceptor(onFulfilled: (config: RequestConfig) => RequestConfig): number
useResponseInterceptor(onFulfilled: ((res: ResponseAny) => ResponseAny) | null,
  onRejected: ((err: RequestError) => ResponseAny | RequestError | null) | null): number
ejectInterceptor(id: number): void
configureRequest(defaults: RequestDefaults): void                             // 默认实例 defaults

/* ============ 多实例（对标 axios.create）============ */
createRequest(defaults: RequestDefaults | null): RequestInstance
```

> 泛型说明（v0.7 定稿）：T 仅静态标注 `ResponseResult<T>`（消费方 TS 视图的 data 类型），响应 data 实际以 `any` 流转、无运行时实例化需求——该形态规避了 uts-for-android 泛型传递丢失约束；实例方法 / 拦截器 data 以 `any` 返回（`ResponseAny = ResponseResult<any>`），业务侧按需断言。`RequestQuickConfig` 为无 url 字段的快捷 config 类型（url 由方法参数提供，与 RequestConfig 拆分）。

```ts
/* 实例对象：与默认实例同构的成员集合（M2 spike 验证其跨代理形态，见 Q2） */
export type RequestInstance = {
	request: (config: RequestConfig) => Promise<ResponseAny>
	get: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	post: (url: string, data: any | null, config: RequestQuickConfig | null) => Promise<ResponseAny>
	put: (url: string, data: any | null, config: RequestQuickConfig | null) => Promise<ResponseAny>
	patch: (url: string, data: any | null, config: RequestQuickConfig | null) => Promise<ResponseAny>
	del: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	head: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	options: (url: string, config: RequestQuickConfig | null) => Promise<ResponseAny>
	getUri: (config: RequestConfig | null) => string
	setConfig: (defaults: RequestDefaults) => void
	useRequestInterceptor: (onFulfilled: (config: RequestConfig) => RequestConfig) => number
	useResponseInterceptor: (onFulfilled: ((res: ResponseAny) => ResponseAny) | null, onRejected: ((err: RequestError) => ResponseAny | RequestError | null) | null) => number
	ejectInterceptor: (id: number) => void
}
```

> UTS 无 call signature（class 实例不可像函数调用），axios 的 `instance(config)` 直调形态不可行，统一走 `instance.request(config)`（Axios 自身亦有此方法）。`delete` 为 UTS 保留字，快捷方法命名 `del`。实例方法不提供泛型（data 以 `any` 流转，见上方泛型说明）。

### 3.2 RequestConfig（对标 axios config，除 url 外全部可选——uts-proxy NPE 红线）

```ts
export type RequestConfig = {
	/** 请求路径；相对路径拼接 baseURL（实例默认 < 请求级覆盖），http(s) 开头原样使用 */
	url: string
	/** 请求方法；不传或 null 使用实例默认（GET） */
	method?: RequestMethod | null
	/** baseURL 请求级覆盖（axios 对标） */
	baseURL?: string | null
	/** 查询参数（axios params 对标）：与 url 既有 query 合并，库内统一编码拼接 */
	params?: UTSJSONObject | null
	/** 请求体；GET/HEAD 的 UTSJSONObject 自动并入 query（见 3.5） */
	data?: any | null
	/** 请求 header；与实例默认 header 浅合并（请求级同名键覆盖） */
	header?: UTSJSONObject | null
	/** 超时毫秒；不传或 null 使用实例默认（60000） */
	timeout?: number | null
	/** 响应 dataType（json / 其他），透传原生 adapter */
	dataType?: string | null
	/** 响应数据类型，透传原生（ArrayBuffer 场景：app-android 4.51+ / app-ios 4.61+） */
	responseType?: string | null
	/** ===== 以下原生能力参数全量透传，本库不抹平，各端生效性见官方文档 ===== */
	enableQuic?: boolean | null
	sslVerify?: boolean | null
	withCredentials?: boolean | null
	firstIpv4?: boolean | null
	enableChunked?: boolean | null
	/** ===== 以下为编排层扩展 ===== */
	/** 状态码校验；不传或 null 使用实例默认（2xx） */
	validateStatus?: ((statusCode: number) => boolean) | null
	/** 取消令牌（3.7）；不传或 null 表示不可取消 */
	cancelToken?: CancelToken | null
	/** 请求体变换；提供即替换内置行为（axios transformRequest 语义） */
	transformRequest?: ((data: any) => any) | null
	/** 响应体变换；提供即替换内置（内置为原样透传） */
	transformResponse?: ((data: any) => any) | null
	/** 逃生舱：拿到原生 RequestTask（chunked 监听等高级场景），v1 核心不依赖它 */
	onTask?: ((task: RequestTask) => void) | null
}

/* 全局 / 实例默认配置（configureRequest / createRequest / setConfig 入参；null 表示沿用内置默认） */
export type RequestDefaults = {
	baseURL: string | null
	timeout: number | null
	header: UTSJSONObject | null
	validateStatus: ((statusCode: number) => boolean) | null
}
```

### 3.3 ResponseResult 与 RequestError（对标 axios response schema 与 AxiosError）

```ts
export type ResponseResult = {
	data: any // 泛型化见 Q10
	statusCode: number
	header: any
	cookies: Array<string>
	config: RequestConfig | null // axios response.config 对标：发起该请求的最终合并配置
}

export type RequestError = {
	code: RequestErrorCode // AxiosError code 对标（字面量联合，见 Q3）
	errSubject: string // 固定 'unix-request'
	errMsg: string
	nativeErrCode: number | null // 原生 fail errCode 原值透传（5 / 600003 / …），不翻译不映射
	statusCode: number | null // HTTP 状态码（BAD_REQUEST / BAD_RESPONSE 时）
	config: RequestConfig | null // axios error.config 对标
	response: ResponseResult | null // axios error.response 对标（HTTP 错误时携带响应原文，含 4xx/5xx body）
}

export type RequestErrorCode =
	| 'ERR_PARAM' // 参数非法（url 为空等）
	| 'ERR_CONFIG' // 配置非法（未设 baseURL 却用相对路径等）
	| 'ERR_CANCELED' // 主动取消（cancelToken，对标 ERR_CANCELED / ECONNABORTED）
	| 'ERR_TIMEOUT' // 超时（原生 errCode 5 归类；nativeErrCode 同时透传）
	| 'ERR_NETWORK' // 网络错误（原生 600003 等网络类归类）
	| 'ERR_BAD_REQUEST' // HTTP 4xx（validateStatus 未通过且 statusCode < 500）
	| 'ERR_BAD_RESPONSE' // HTTP 5xx（validateStatus 未通过且 statusCode >= 500）
	| 'ERR_NATIVE' // 其余原生失败（nativeErrCode 透传，含 1000 / 100001-100003 / 600008 / 600009 / 602001）
```

**错误归类规则（确定性映射，无歧义分支）**：参数/配置校验失败 → `ERR_PARAM` / `ERR_CONFIG`（不发网络）；已发请求后 fail → 原生 errCode 5 → `ERR_TIMEOUT`，600003/600010 → `ERR_NETWORK`，其余 → `ERR_NATIVE`；cancel 路径 →
`ERR_CANCELED`；success 但 validateStatus 未通过 → 4xx `ERR_BAD_REQUEST` / 5xx `ERR_BAD_RESPONSE`（`response` 挂载响应原文）。

### 3.4 拦截器（对标 axios interceptors，v1 仅同步——Q4）

**链路语义（无需 throw，规避 UTS「仅可 throw Error 子类」约束）：**

- 请求拦截器按**注册顺序**执行，返回处理后的 `RequestConfig` 逐层传递；
- 响应拦截器按**注册顺序**执行，`onFulfilled` 返回 `ResponseResult` 继续传递；
- 响应 `onRejected` 收到 `RequestError`：返回 `ResponseResult` → **恢复**转 resolve；返回新的 `RequestError` → 以新错误继续 reject（错误转换）；返回 `null` → 携带原错误继续 reject；
- 拦截器内抛出的任何异常视为链路 bug，库内捕获并转为 `ERR_NATIVE`（避免 UTS throw 约束破坏链路）。

### 3.5 内置 transform 与自动序列化（对标 axios 默认 transformer；原则：序列化依赖原生，库内不重造）

| 场景                                              | 内置行为                                                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST/PUT/PATCH + data 为 `UTSJSONObject`          | **data 原样透传原生**（请求体序列化由原生 adapter 处理，app-android 原生仅接受 UTSJSONObject/string）；仅当业务未显式设置 `content-type` 时**补设 `application/json`** |
| POST/PUT/PATCH + data 为 `string` / `ArrayBuffer` | 原样透传（Content-Type 业务自管）                                                                                                                                      |
| GET/HEAD + params 或 data 为 `UTSJSONObject`      | **库内统一编码为 query string** 拼接 url（与 params 合并、URL 编码、`?`/`&` 容错），data 不透传原生——不依赖官方未明文的 GET data 转换行为（1.2 ⑥）                     |
| 响应（dataType=json）                             | 依赖原生内置 JSON.parse，`transformResponse` 默认原样透传                                                                                                              |
| `transformRequest` / `transformResponse` 提供时   | **替换**内置对应方向的行为（axios 语义）；transform 后的 data 为 UTSJSONObject 时同上补设 Content-Type                                                                 |

### 3.6 配置三级合并（对标 axios defaults < instance < request）

- 合并顺序：内置默认 → 实例 defaults（`createRequest` / `setConfig` / 默认实例 `configureRequest`）→ 请求级 `RequestConfig`；
- 规则：标量字段（timeout 等）请求级有值即覆盖；`header` 浅合并（实例 header 键被请求级同名键覆盖）；回调字段（validateStatus / transform / cancelToken）请求级有值即整体覆盖，不合并；
- **baseURL 拼接**：`url` 以 `http://` / `https://` 开头 → 绝对地址原样使用；否则 `baseURL`（双侧斜杠容错）+ `url` 拼接；无 baseURL 且 url 相对 → `ERR_CONFIG`（发请求前 fail-fast，不发网络）。

### 3.7 取消（对标 AbortController / CancelToken：库内确定性 abort）

```ts
/* 使用形态（与 axios CancelToken.source() 同心智） */
const source = createCancelSource()
request({ url: '/api/x', cancelToken: source.token })
source.cancel('页面卸载') // → 该 token 关联的进行中请求被 abort，reject ERR_CANCELED
```

```ts
export type CancelToken = {
	/** 是否已取消 */
	canceled: boolean
	/** 取消原因；未取消为 null */
	reason: string | null
}

export type CancelSource = {
	token: CancelToken
	cancel: (reason: string | null) => void
}

export type CreateCancelSource = () => CancelSource
```

- 库内维护 token → 进行中 `RequestTask` 映射，`cancel` 时由**库主动调 `task.abort()`**——取消语义 100% 确定性，不依赖原生 fail errMsg 特征匹配；
- 发起请求时 token 已取消 → 直接 reject `ERR_CANCELED`，不发网络；
- token 可关联多个请求，cancel 一次性取消全部；
- 原生侧 abort 引发的 fail（库外路径，如业务自持 onTask 手工 abort）归类 `ERR_NATIVE` 并文档标注。

### 3.8 请求管线（实现分层）

```
request(config)                                     [默认实例或任意实例，同一管线]
      │
      ▼
normalize 层：三级配置合并（内置默认 < 实例 defaults < 请求级）
      │         baseURL 拼接 / params+GET data 编码 query / 参数与配置校验（fail-fast → ERR_PARAM / ERR_CONFIG）
      ▼
请求拦截器链（按注册顺序逐层变换 config）
      │
      ▼
transformRequest（内置 = Content-Type 补设，或业务替换版）
      │
      ▼
sendRequest（唯一 adapter 收敛点：uni.request 透传 method/data/header/timeout/dataType/responseType/
      │            enableQuic/sslVerify/withCredentials/firstIpv4/enableChunked）
      │            cancelToken → 任务登记（供 cancel 确定性 abort）
      ├─ cancel → ERR_CANCELED
      ├─ fail  → 原生 errCode 归类（5→ERR_TIMEOUT / 网络类→ERR_NETWORK / 其余→ERR_NATIVE，nativeErrCode 透传）
      ▼
validateStatus（默认 2xx；未通过 → 4xx ERR_BAD_REQUEST / 5xx ERR_BAD_RESPONSE，response 挂载）
      │
      ▼
transformResponse（内置透传，或业务替换版）
      │
      ▼
resolve ResponseResult（含 config 引用）
```

### 3.9 目录结构（对齐 unix-utils v0.8 惯例：职责目录 + index.uts 桶文件）

```
packages/core/                       # = uni_modules/mx-request 插件本体（Q1：mx-request）
├── package.json                     # @meng-xi/unix-request（main: utssdk/index.uts）
├── README.md / README-en.md / license.md
├── utssdk/
│   ├── interface.uts                # 对外声明：API 函数类型别名 + 全部对外 type（内联，官方必需）
│   ├── index.uts                    # 入口：泛型 API 具名 export function（request/快捷方法）+ 非泛型 const 模式
│   │                                #   （getUri/拦截器/configureRequest/createRequest/createCancelSource）+ 常量
│   └── request/
│       ├── core.uts                 # dispatchImpl 主流程（3.8 管线）+ sendRequest（唯一 adapter 收敛点）
│       │                            #   + classifyFail（fail 归类）+ runResponseChain（响应拦截器状态机）
│       ├── instance.uts             # defaultCore / createRequestImpl / buildInstance / getUriImpl / setCoreDefaults
│       ├── shortcut.uts             # 方法别名装配（get/post/…Impl，携 InstanceCore 走 dispatch）
│       ├── interceptors/
│       │   └── index.uts            # 拦截器注册表操作（注册表挂 InstanceCore，实例隔离；链路执行在 core.uts）
│       ├── config/
│       │   ├── index.uts            # configureRequestImpl（默认实例 defaults 适配层；存储在 InstanceCore）
│       │   └── normalize.uts        # normalizeRequest（三级合并 + baseURL 拼接 + query 编码 + fail-fast；配置域）
│       ├── cancel/
│       │   └── index.uts            # createCancelSourceImpl / token→task 注册表 / 确定性 abort
│       ├── transform/
│       │   └── index.uts            # Content-Type 补设 / transformRequest·Response 应用
│       ├── constants/
│       │   └── defaults.uts          # BUILTIN_TIMEOUT / BUILTIN_METHOD / BUILTIN_VALIDATE_STATUS /
│       │                            #   BUILTIN_CONTENT_TYPE / BUILTIN_ERR_SUBJECT
│       ├── types/
│       │   └── index.uts            # 内部类型：RequestInterceptorEntry / ResponseInterceptorEntry /
│       │                            #   InstanceCore / NormalizeResult / ChainOutcome
│       └── utils/
│           ├── url.uts              # isAbsoluteUrl / encodeParams（确定性编码）/ appendQuery / joinUrl
│           └── error.uts            # buildRequestError / isRequestErrorValue（联合类型判别探针）
└── （无平台目录）                    # 纯编排层，uni.request 全端统一，无需平台目录
```

> 实现期微调（相对早期规划）：enums/ 不设（RequestMethod / RequestErrorCode
> 字面量联合定义在 interface.uts，错误码内联字面量即可）；utils / constants
> 不设桶文件（消费方按具名文件 import，规避桶文件跨级解析风险）；
> types/index.uts 直接承载内部类型（不建 request.uts）。

**入口常量**：`DEFAULT_TIMEOUT = 60000`、`DEFAULT_METHOD: RequestMethod = 'GET'`、`REQUEST_ERR_SUBJECT = 'unix-request'`。

### 3.10 工程与验证

- **仓库脚手架**（对齐 unix-utils）：`package.json`（pnpm workspace）/ `.editorconfig` / `.prettierrc` / `.npmrc` / `.gitignore` / `tsconfig.json` / `bump.config.ts` / `scripts/sync-uni-modules.mjs`（复制 core →
  playground `uni_modules/mx-request`，dest package.json 手工维护）/ `docs/design/request.md`（本文档）；
- **playground**：标准 uni-app x 工程，测试页矩阵覆盖——三级配置合并与 baseURL 拼接（绝对 / 相对 / 斜杠容错 / 缺失 ERR_CONFIG）、8 种 method、params 与 GET
  query 编码、header 合并与键大小写实测、Content-Type 补设、原生 UTSJSONObject data 序列化实测、transformRequest/Response 替换内置、responseType=ArrayBuffer、超时（ERR_TIMEOUT +
  nativeErrCode=5）、cancelToken 取消（ERR_CANCELED）、4xx/5xx（ERR_BAD_REQUEST/RESPONSE +
  response 挂载）、参数非法（ERR_PARAM）、拦截器注册 / 移除 / 恢复 / 错误转换、createRequest 多实例隔离、configureRequest 全局生效；
- **DoD**：对齐 core-protocol——五端编译通过 + playground 运行日志验证每条管线分支的实际输出，不依赖静态检查。

### 3.11 风险与待实测项

> M2 spike（2026-10-10，HBuilderX 5.26）已验证前三项签名风险，结论如下：

| 风险                                                    | 说明                                                                                                   | 结论 / 缓解                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| uts-proxy 对泛型导出的支持未知                          | 官方框架 API 已用泛型（RequestSuccess.data: T），但插件导出须经 uts-proxy 代理生成，能否编码泛型未验证 | ✅ **spike 通过**：`type Request = <T>(config) => Promise<ResponseResult<T>>` 泛型函数类型别名 + 泛型 const 入口 + `ResponseResult<T>` 泛型 type 全部通过编码，Kotlin 产物完整保留泛型。Q10 方案 A 落定：全 API 泛型化。⚠️ **M4 实证修正（v0.7）**：spike 通过的是 UTS→Kotlin 转译层，Kotlin 编译器层 `typealias Request = <T>(...)` 为非法语法且 const 绑定泛型字面量被禁——最终形态定稿为入口具名 `export function apiName<T>(...)`（见下「泛型导出形态」行），云打包 compileReleaseKotlin 通过 |
| `RequestInstance`（含函数字段的返回对象）跨代理形态未知 | unix-utils 从未跨代理返回过含函数字段的对象（createRequest 的核心风险）                                | ✅ **spike 通过**：Kotlin 生成含 13 个函数字段的 class（`(config: RequestConfig__1) -> UTSPromise<ResponseAny__1>` 等），代理编码正常。多实例进 v1                                                                                                                                  |
| Promise reject 载荷跨代理边界                           | 纯对象 type reject 已有 ToastFail 先例；`RequestError` 含可空多字段结构同理                            | ✅ **spike 通过**：RequestError 构造 + reject 编码正常（桩 url 命中即 reject）                                                                                                                                                                                                      |
| 拦截器回调签名跨代理                                    | 「函数参数直接是函数」的注册形态未验证（ToastOptions 先例为「对象字段内函数」）                        | ✅ **spike 通过**：`useRequestInterceptor(onFulfilled: (config) => RequestConfig)` 与 useResponseInterceptor 双可选回调签名编码正常                                                                                                                                                |
| uts-proxy 回调字段 `any` 参数编码                       | `transformRequest: (data: any) => any` 等含 any 参数的函数字段编码待验证                               | ✅ **M3 实测通过**：编译三端零 warning + Web 运行时替换内置 transform 生效（transformRequest 注入字段、transformResponse 包裹 data 均回显正确）。注意语义边界：GET/HEAD 的 data 已并入 query 置 null，transformRequest 收到 null，transform 内需判空                                 |
| query 编码的 URL 转义                                   | UTS `encodeURIComponent` 各端可用性待编译验证；官方未明文 GET data 编码规则                            | ✅ **M3 Web 实测通过**：空格→%20、`/`→%2F、数字 / 布尔正确、GET data 并入 query 顺序正确（`?a=a%20b&n=1&ok=true&from-data=get-body`）；其余端随 M4 补验                                                                                                                             |
| 原生 UTSJSONObject data 的 Content-Type 默认值          | 各端（Cronet / web XHR / 小程序）对 UTSJSONObject 请求体的默认 Content-Type 一致性未明文               | 库内显式补设 `application/json`（未显式设置时）；✅ **M3 Web 实测通过**（POST UTSJSONObject 回显 content-type=application/json）；其余端随 M4 补验                                                                                                                                              |
| header 键大小写                                         | 原生可能对 header 键做小写化（hello 示例专项检测佐证）                                                 | 库内不做规范化；playground 实测矩阵记录各端行为，文档标注                                                                                                                                                                                                                          |
| 微信 / 鸿蒙端 `enableQuic` / `enableChunked` 等参数差异 | 原生能力差异，非库内可抹平                                                                             | 透传 + 文档标注                                                                                                                                                                                                                                                                    |
| 业务自持 onTask 手工 abort 的 fail 归类                 | 原生 abort 后 fail 的 errCode / errMsg 未在官方文档列明                                                | 归类 `ERR_NATIVE` 文档标注；取消一律走 cancelToken 确定性通道                                                                                                                                                                                                                      |
| Android dex 编译（Kotlin 编译器层）                     | appResource 仅产出 .kt 源码（UTS→Kotlin 层）；Kotlin 产物中类型名 `__1` 重整（框架符号避让）自洽无害，但泛型 typealias 等语法未经 Kotlin 编译器验证 | ✅ **M4 首项完成（v0.7）**：Android 云打包（HBuilderX 5.26 cli pack）compileReleaseKotlin 零错误，APK 产出成功——UTS→Kotlin 产物经真实 Kotlin 编译器 + dex 全链路验证通过 |
| 泛型导出形态（M4 Kotlin 实证，v0.7 定稿）               | UTS `type X = <T>(...)` 函数类型别名转译为 Kotlin `typealias X = <T>(...) -> ...` 为非法语法（Kotlin 泛型参数必须声明在 typealias 名上）；const 绑定的泛型函数字面量转译为匿名 `fun <T>` 被 Kotlin 禁止（Type parameters are prohibited here，首轮云打包 8 处编译错误根因） | ✅ **最终形态**：泛型 API 统一入口具名 `export function apiName<T>(...)`（顶层具名 `fun <T>` 合法）；T 仅静态标注 ResponseResult<T>，响应 data 实际以 any 流转、无运行时实例化需求——同时规避 uts-for-android 泛型传递丢失约束（蒸汽模式无此问题，VDOM 模式才有）；非泛型 API 维持 const 模式 |
| uni.request 泛型调用的 as 断言（M4 Kotlin 实证）        | M2 验证可用的 `uni.request<RequestSuccess<any>>({...} as RequestOptions<RequestSuccess<any>>)` 形态，as 断言转译后丢失泛型实参 | ✅ **修正**：先声明显式类型的 options 变量（`let options: RequestOptions<RequestSuccess<any>> = {...}`）再传 `uni.request<T>(options)`；注意泛型实参是数据类型 T 而非 RequestSuccess<T> |
| 函数类型参数逆变（M4 Kotlin 实证）                      | Kotlin 函数类型参数逆变：库内 transform 回调签名放宽为 `(data: any \| null) => any` 后，页面侧自定义回调若仍写 `(data: any)` 即类型不匹配编译报错 | ✅ **已适配**：interface.uts 的 transformRequest / transformResponse 签名统一 `any \| null`，playground 页面回调同步改为 `(data: any \| null)`（GET/HEAD 场景 data 恒为 null，与 3.5 语义边界一致） |
| `RequestSuccess<any>.data` 的 Kotlin 可空性（M4 实证）  | res.data 在 Kotlin 绑定层为 `Any?`，与库内 ResponseResult.data 非空 any 契约冲突（第二轮云打包仅剩 2 错的根因） | ✅ **已修复**：响应入口用 UTS 官方 `??` 空值合并操作符归一（core.uts `const rawData: any = res.data ?? emptyData`），ResponseResult.data 契约保持非空 any |
| 回调闭包引用外层 RequestTask 自引用（M4 Kotlin 实证）   | success/fail 回调闭包直接引用外层 `let task`，转译为 Kotlin val 初始化器自引用（编译错误） | ✅ **已修复**：taskHolder 中转——`let taskHolder: RequestTask \| null = null` 先声明，回调内判空后 `taskHolder as RequestTask` 使用，发送后回填 |
| UTSJSONObject 遍历的 Kotlin 签名（M4 实证）             | `toMap().forEach((value, key) => {})` 双参回调转译后 Kotlin 签名不匹配 | ✅ **已修正**：统一 `UTSJSONObject.keys()` 取键数组 + 索引 for 循环（跨端签名一致）。⚠️ iOS 端 keys() 兼容性官方标注为 x，随 M4 iOS 首测验证 |
| 编译环境依赖                                            | 鸿蒙需 DevEco Studio 工具链（HBuilderX 运行配置）；iOS 需 macOS；Android dex 需真机或云打包           | ✅ Android dex 已云打包验证（v0.7）；鸿蒙 / iOS 因环境（DevEco / macOS）延后，待环境就绪补验；微信矩阵待开发者工具人工实测、Android 真机矩阵待真机到位                                                                                                                                                                 |
| onRejected 返回联合类型的运行时判别                     | `ResponseAny \| RequestError \| null` 在 Kotlin 端编译为 `Any?`（产物已验证），web 端 type 别名擦除，instanceof / typeof 均不可用 | ✅ **策略落定（v0.5）**：`as RequestError` 强转探针 + errSubject 契约值判别（`'unix-request'`）。Kotlin 端强转 CCE 由 catch 兜住（UTS catch 编译为 `catch (e: Throwable)`，产物已验证）；web 端 as 擦除后等价字段探测（微信产物已验证，RequestError 编码为真实 class）。**遗留：Swift 端 `as` 强转语义（`as!` 崩溃 vs `as?` 空安全）未验证，M4 iOS 首测项** |
| 拦截器回调字段含 `any` 参数（transformRequest 等）编码  | 3.11 早期待实测项                                                                                       | ✅ **编译通过（v0.5）**：transformRequest / transformResponse / validateStatus / onTask 回调字段随全量实现三端编译通过；运行时调用行为随 M3/M4 实测                                                                                                                                |
| 快捷方法 method 注入缺失（M3 运行时发现并修复）         | post/put/patch/del/head/options 快捷方法此前依赖 config.method 透传（快捷 config 通常为 null），实际以默认 GET 发出（服务端 405 暴露）——编译期零告警 | ✅ **已修复（v0.6）**：withUrl / withData 由方法名固定注入 method（config.method 不透传，与 axios 语义一致）；并新增 `RequestQuickConfig`（无 url 的快捷 config 类型），消除「快捷 config 须含必填 url」的类型别扭。三端重编译零 warning + Web 实测 POST/PUT/PATCH/DELETE/HEAD/OPTIONS 全部按真实 method 到达 |
| onRejected 恢复 / 换错 / 放行运行时路径                  | as 探针 + errSubject 契约判别策略的实际执行路径验证                                                    | ✅ **M3 Web 实测通过**：恢复（404 → 返回兜底 ResponseResult，resolve 599）、换错（404 → ERR_CANCELED）、放行（null 携原错误 reject）、eject 后失效，四条路径全部符合 axios 语义；Swift 端仍留 M4                                                                                     |

---

## 4. Q&A 裁决记录

> v0.2 已确认：Q1–Q9 全部按建议落定，以下为裁决结论与两处批注的答复。

| #   | 裁决                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | ✅ npm `@meng-xi/unix-request`，插件 id `mx-request`                                                                                                                                                                           |
| Q2  | ✅ `createRequest` 为主目标，M2 与泛型一并 spike；失败则 v1 仅默认实例，多实例列 v2                                                                                                                                            |
| Q3  | ✅ 错误 code 对标 AxiosError 字符串字面量联合，原生明细由 `nativeErrCode` 携带                                                                                                                                                 |
| Q4  | ✅ 拦截器 axios 语义全对标，v1 仅同步                                                                                                                                                                                          |
| Q5  | ✅ params / transform / 自动 Content-Type 进 v1；`paramsSerializer` 自定义不进                                                                                                                                                 |
| Q6  | ✅ `createCancelSource()` 库内确定性 abort；onTask 为逃生舱                                                                                                                                                                    |
| Q7  | ✅ 默认 2xx 成功 + validateStatus 可配                                                                                                                                                                                         |
| Q8  | ✅ upload/download、进度、重试、loading、刷新、auth、adapter 可替换均不进 v1                                                                                                                                                   |
| Q9  | ✅ 五端全含（Android / iOS / Web / 微信 / 鸿蒙），HBuilderX 基线 4.41+；支付宝 5.31 不入 v1 矩阵                                                                                                                               |
| Q10 | ✅ 方案 A 维持（M2 首日 spike）。**批注答复**：官方框架 API 已用泛型（`RequestSuccess.data: T`），证明 UTS 类型系统支持泛型；但官方 API 是框架内置、不经过 uts-proxy 代理生成，插件导出的泛型编码能力仍独立存疑，故 spike 保留 |

**批注①（官方无 params，是否自动转换？）答复**：确认官方 `RequestOptions` 只有 `data` 无 `params`。GET data → query 是 uni-app 惯例行为（hello uni-app x 官方示例含「检测query」专项测试佐证），但 uni-app
x 文档未明文编码规则（编码方式 / 嵌套对象 / 各端一致性均无承诺）。故本库 `params` 仍进 v1 且**由库内确定性编码**，GET 时 data（UTSJSONObject）并入 query 后不再透传原生——把隐式行为变成显式契约。

**批注②（官方是否支持泛型）答复**：见 Q10。

---

## 5. 里程碑

| 阶段                | 内容                                                                                                                                                    | DoD                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| M1 设计定稿         | ✅ Q1–Q10 落定（本文档 v0.3）                                                                                                                           | 已完成                         |
| M2 核心管线 + spike | ✅ 脚手架 + interface.uts 全量签名 + 三项编译 spike（泛型 / RequestInstance 跨代理 / 拦截器回调签名）+ Promise/统一错误桩管线；**Web / 微信 / Android(UTS→Kotlin) 三端编译通过**；鸿蒙 / iOS / Android dex 因环境限制（DevEco / macOS / 真机）延后 M4 | spike 结论落文档 ✅（3.11）    |
| M3 拦截器与完整体系 | ✅ core 管线全量实现落地（normalize 三级合并 / 双拦截器链状态机 / transform / params 确定性编码 / cancelToken 确定性 abort / 多实例隔离 / 统一错误 / uni.request 接入）；Web(h5 release) / 微信 / Android(UTS→Kotlin) 编译回归零 warning；**playground 15 项测试矩阵扩展完成，Web 真实网络运行验证 15/15 符合预期**（40 条断言日志逐项核对，含 ERR_CONFIG / ERR_PARAM / ERR_TIMEOUT+nativeErrCode=5 / ERR_CANCELED 双场景 / 4xx·5xx 挂 response / 拦截器恢复·换错·放行·eject / 多实例隔离 / getUri 编码 / transform 替换 / ArrayBuffer）；**运行时发现并修复快捷方法 method 注入缺失 bug**（post/put/patch 静默降级 GET），引入 RequestQuickConfig 拆分快捷 config 类型 | 编译 + 运行双验证通过（Web）    |
| M4 全端验证         | **进行中**（首项交付 ✅）：**Android dex 云打包验证通过**（三轮迭代：首轮 5 类 Kotlin 根因约 120 错 → 修 7 文件；第二轮剩 2 错 res.data 可空性 → `??` 归一修复；第三轮 compileReleaseKotlin 零错误 APK 产出），**泛型导出形态定稿**（具名 `export function apiName<T>`，3.11 落 7 条 Kotlin 实证）；微信端 15 项矩阵待开发者工具人工实测、Android 真机矩阵待真机到位；鸿蒙 / iOS 因环境限制（DevEco / macOS）延后，限制项随 m4-5 统一回写；Swift as 语义 / iOS keys() 留 iOS 首测 | 运行日志验证，无运行时错误     |
| M5 文档             | README（中英）+ 使用指南（含拦截器实现重试 / loading / 业务拆包的示例）                                                                                 | 与 unix-utils 文档风格对齐     |

---

## 6. 修订记录

| 版本 | 日期       | 修订内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-10-10 | 初稿：基于 unix-utils v0.8 工程范式与 uni.request 官方文档事实，提出轻编排层设计（Q1–Q10）                                                                                                                                                                                                                                                                                                                                                                                                  |
| v0.2 | 2026-10-10 | **核心功能体系对标 Axios 重构**：新增 1.3 axios 能力映射总纲；API 升级为默认实例 + createRequest 多实例；RequestConfig 增 params / baseURL / cancelToken / transformRequest / transformResponse；新增自动序列化与 Content-Type、三级配置合并、CancelSource 取消；错误体系对标 AxiosError 字符串 code + config/response 挂载；目录增 instance / cancel / transform 模块；Q&A 按新体系重组                                                                                                    |
| v0.3 | 2026-10-10 | **Q1–Q9 确认落定 + 批注答复**：批注①答复（官方无 params、GET data→query 未明文，params 由库内确定性编码）；批注②答复（官方 RequestSuccess.data: T 证明类型系统支持泛型，插件代理层仍需 spike）；复核修正：RequestConfig 补 responseType 与 enableQuic/sslVerify/withCredentials/firstIpv4/enableChunked 全量透传字段；序列化方案修正为「data 透传原生 + 仅补默认 Content-Type」（对齐 1.4 不重造原则，替代 v0.2 库内 stringify 方案）；风险表补 Content-Type 默认值与 header 键大小写实测项 |
| v0.4 | 2026-10-10 | **M2 spike 完成**：三项签名风险全部验证通过（泛型导出 / RequestInstance 函数字段对象 / 拦截器函数参数 + RequestError reject 载荷），Q10 方案 A 落定全 API 泛型化；Web / 微信 / Android(UTS→Kotlin) 三端编译通过，鸿蒙 / iOS / Android dex 因环境限制延后 M4（3.11 新增两条环境风险）；工程实测新坑记录至 LESSONS_LEARNED（UTS 插件内部相对 import 三规则 / CLI 编译需有效 appid / launch web --compile 语义 / 微信产物按引用图导出 API） |
| v0.5 | 2026-10-11 | **core 管线全量实现**（3.8 全分支落地）：normalize（三级合并 / baseURL 拼接 / params 确定性编码 / GET data 并入 query / fail-fast）、请求拦截器链、transformRequest + Content-Type 补设、cancelToken 发送前检查 + 任务注册表确定性 abort、uni.request 接入（RequestOptions 全量透传）+ fail errCode 归类（5/600003·600010/其余 + 取消检测）、validateStatus（4xx/5xx 错误挂 response）、transformResponse、响应拦截器状态机（恢复 / 换错 / 放行 + 异常转 ERR_NATIVE，前段错误按 axios 语义进入错误链）、多实例 InstanceCore 隔离、getUri；**onRejected 联合类型判别策略落定**（as 探针 + errSubject 契约 + catch(Throwable)，Kotlin / 微信产物级验证，Swift 留 M4）；3.9 目录树按实现实况更新；Web(h5 release) / 微信 / Android 三端编译回归零 warning |
| v0.6 | 2026-10-11 | **M3 运行时验证完成（Web 15/15）+ 快捷方法 API 修正**：playground 扩为 15 项测试矩阵（对应 3.10 清单），Web 真实网络实测 40 条断言日志逐项核对全部符合预期（getUri 编码 / 三级合并 / ERR_CONFIG·PARAM·TIMEOUT·CANCELED / 4xx·5xx 挂 response / 拦截器恢复·换错·放行·eject / 多实例隔离 / transform 替换 / ArrayBuffer）；**发现并修复快捷方法 method 注入缺失 bug**（post/put/patch 静默降级 GET，服务端 405 暴露）——withUrl/withData 由方法名固定注入 method；**新增 `RequestQuickConfig`**（快捷 / 实例快捷方法 config 无 url 字段，RequestQuick / RequestWithData / RequestInstance 快捷方法签名同步改），入口补 `export type` 对外类型转发；3.11 补充运行验证结论与 GET/HEAD transformRequest 收 null 语义边界；经验记录至 LESSONS_LEARNED 18–23 |
| v0.7 | 2026-10-12 | **M4 首项交付：Android dex 云打包验证通过 + 泛型导出形态定稿**：三轮打包迭代（首轮 5 类 Kotlin 根因约 120 错修 7 文件 → 第二轮剩 res.data 可空性 2 错用 UTS 官方 `??` 归一修复 → 第三轮 compileReleaseKotlin 零错误 APK 产出）；**泛型 API 最终形态**：UTS `type X = <T>(...)` 转译的 Kotlin `typealias X = <T>(...)` 非法 + const 绑定泛型字面量被禁，改入口具名 `export function apiName<T>(...)`（1.5-3 红线修订、3.1 签名块同步泛型形态与 ResponseAny）；3.11 新增 7 条 Kotlin 实证（typealias / const fun\<T\> / uni.request as 断言丢泛型 / 函数参数逆变 / RequestSuccess.data Any? / taskHolder 自引用 / toMap().forEach 签名）与 iOS keys() 兼容性风险标注；M4 里程碑行更新（微信矩阵待人工实测 / 真机矩阵待真机 / 鸿蒙·iOS 延后）；经验记录至 LESSONS_LEARNED 24–32 |
| v0.8 | 2026-10-12 | **目录结构微调（refactor-1，行为零变化）**：utils/merge.uts 归位配置域 → config/normalize.uts（三级合并与归一化是请求前配置加工，与 configureRequest 同域，utils 仅留 url / error 通用工具）；引用方 core.uts / instance.uts import 同步；3.9 目录树与入口注释按实况更新。验证：h5 / mp-weixin / app-android 三端编译回归零 warning + Web 矩阵冒烟 15/15 通过（45 行断言明细无 FAIL） |
