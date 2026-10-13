# 更新日志

## [0.1.0] - 2026-10-12

首个可用版本：以 `uni.request` 为唯一底层依赖的 uni-app x 网络请求库，核心能力体系对标 axios。

### 新增

- **请求主入口 `request<T>(config)`**：一个对象描述全部配置，返回 `Promise<ResponseResult<T>>`（泛型 `T` 为 `res.data` 提供静态标注），失败统一 reject [`RequestError`](/api/type-request-error)
- **七种快捷方法**：`get` / `post` / `put` / `patch` / `del` / `head` / `options`，method 由方法名固定注入（`delete` 为 UTS 保留字，快捷方法命名 `del`）；快捷配置 [`RequestQuickConfig`](/api/type-request-quick-config)
  不含 `url` 字段，url 由方法参数提供，避免调用方为满足必填字段传占位值
- **默认实例 + 多实例**：默认实例开箱即用，全局默认经 `configureRequest` 配置；`createRequest(defaults)` 创建隔离实例（defaults 与拦截器注册表互不影响），心智对标 `axios.create`
- **请求/响应拦截器**：多枚有序注册、`ejectInterceptor(id)` 移除；响应错误链支持三条路径——恢复（返回响应）/ 换错（返回新错误）/ 放行（返回 `null`），语义对标 axios
- **统一错误结构 [`RequestError`](/api/type-request-error)**：8 类错误码字面量联合（`ERR_PARAM` / `ERR_CONFIG` / `ERR_CANCELED` / `ERR_TIMEOUT` / `ERR_NETWORK` / `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` /
  `ERR_NATIVE`）；原生 `errCode` 经 `nativeErrCode` 原值透传不翻译，`config` 与 `response` 原文挂载（4xx/5xx 响应体不丢失）
- **请求配置**：`baseURL` 自动拼接（http(s) 开头原样使用）、header 浅合并（请求级同名键覆盖）、`timeout` 超时、`validateStatus` 状态码校验，内置默认 → 实例默认 → 请求级三级合并；除 `url` 外全部可选，实现层空安全兜底
- **params 与请求体处理**：`params` 与 url 既有 query 合并、库内统一确定性编码（`encodeURIComponent`，对象值 JSON 序列化兜底）；GET/HEAD 的 `UTSJSONObject` 请求体自动并入 query
- **请求与响应转换**：`transformRequest` / `transformResponse` 请求级转换，提供即替换内置行为（内置：请求体自动序列化、响应体原样透传；GET/HEAD 场景 transformRequest 收到 `null`）
- **请求取消**：`createCancelSource()` 创建取消源，`token` 挂到 `config.cancelToken`，`cancel(reason)` 确定性 abort 关联的全部进行中请求，被取消请求以 `ERR_CANCELED` reject
- **`getUri()`**：离线构建完整 URL（含 params 编码），不发网络
- **逃生舱 `onTask`**：透出原生 `RequestTask`（chunked 分块监听等高级场景）；`enableQuic` / `sslVerify` / `withCredentials` / `enableChunked` 等原生能力参数全量透传不抹平

### 平台支持

- **Web**：编译产物验证通过，15 项真实网络测试矩阵全部通过
- **微信小程序 / Android**：编译产物验证通过（Android 含云打包 release 编译零错误）；小程序端 15 项矩阵待开发者工具人工实测、Android 真机矩阵待真机验证
- **iOS / 鸿蒙**：代码已适配，受环境限制暂未实测（iOS 需 macOS、鸿蒙需 DevEco Studio）
