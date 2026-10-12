# 介绍

`@meng-xi/unix-request`（uni_modules 插件 ID：`ux-request`）是梦曦工作室 MengXi-Studio 为 **uni-app x** 提供的网络请求库，API 心智全面对标 **Axios**，核心语言为 **UTS**（`.uts`），底层唯一依赖官方 `uni.request`——不重造网络栈，只做编排层。

## 为什么需要它

`uni.request` 是官方原生网络 API，直接使用在业务成型后会遇到一系列结构性痛点：

| uni.request 的痛点 | 本库对策 |
| --- | --- |
| 回调式 API（`success / fail / complete`），无 Promise、无泛型、无方法别名 | `request<T>(config)` 返回 `Promise<ResponseResult<T>>`，失败统一 reject `RequestError`；另附七种快捷方法 |
| HTTP 4xx / 5xx 依然走 `success` 回调，每个调用点手工判 `statusCode` | `validateStatus` 默认 2xx，未通过直接 reject `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` 并挂载响应原文 |
| 网络层错误（原生 `errCode`）与 HTTP 层错误两套体系 | 统一 `RequestError`：8 类错误码 + `nativeErrCode` 原值透传 + config / response 挂载 |
| 无拦截器，token 注入 / 日志 / 上报只能复制粘贴 | 请求 / 响应拦截器链：多枚、有序、可 eject，错误可恢复 / 换错 / 放行 |
| 无取消封装，`RequestTask.abort()` 需自行持引用、语义不确定 | `createCancelSource()` 库内确定性 abort，一个 token 可取消多个请求 |
| 无 `baseURL` / `params` / 默认配置 / 多实例层级 | 三级配置合并（内置默认 → 实例默认 → 请求级）+ `createRequest` 多实例 |
| GET data → query 官方未明文编码规则，五端一致性无承诺 | `params` 库内确定性编码（`encodeURIComponent`），GET/HEAD data 并入 query 为显式契约 |

unix-request 的 API 心智全面对标 **Axios**，把这些痛点一次性收编，全部构建在 `uni.request` 之上。

## 适合谁

- **被 uni.request 回调与散落配置折磨的 uni-app x 开发者**：想要 Promise 化、统一错误、集中配置。
- **从 Axios 或 axios 风格请求库迁移过来的团队**：拦截器、实例、transform、取消的心智可以原样平移。
- **需要跨 Web / 小程序 / App 保持请求行为一致的工程**：一套 API 覆盖多端，平台差异集中在极少数原生透传参数上。

## 抹平边界：本库管什么、不管什么

- **第一层 · 编排层（本库全包）**：实例体系、拦截器链、transform、params、统一错误、取消、三级配置合并——Axios 功能体系全量对标。
- **第二层 · 网络栈层（原样透传）**：QUIC / chunked / cookie / 请求体序列化等能力完全复用 `uni.request` 官方原生实现，本库不抹平、原样暴露并文档标注。

也就是说：凡是「请求怎么发出去之前」的逻辑，本库全管；凡是「网络本身怎么走」，交给官方原生。

## 明确不做的事（v1 非目标）

了解边界与了解能力同样重要，以下不在 v1 范围内：

- `uni.uploadFile` / `uni.downloadFile` 封装、上传下载进度；
- 请求重试、loading 指示器、token 无感刷新的**内置实现**（三者均可基于拦截器实现，实现路径见[拦截器](./interceptors)）；
- 业务 code 统一拆包的内置行为（HTTP 层与业务层分离，用响应拦截器或 `transformResponse` 自行实现）；
- `auth`（Basic）/ proxy / `paramsSerializer` 自定义 / adapter 可替换。

## 工程形态

- **标准 uni_modules UTS 插件**：npm 包名 `@meng-xi/unix-request`，uni_modules 插件 ID `ux-request`，`utssdk/` 官方目录结构 + `interface.uts` 对外声明；
- **UTS 源分发**：由 uni-app x 编译链按目标平台现场编译（Web / 小程序 → JS，Android → Kotlin，iOS → Swift），无运行时桥接开销；
- **纯编排层**：`uni.request` 全端统一，插件内无平台目录，一套实现覆盖五端；
- **playground 自检工程**：仓库内 `packages/playground` 含 15 个功能自检页，覆盖本文档全部能力点。

unix-request 是 MengXi-Studio 工具矩阵的第三员：[unix-router](https://github.com/MengXi-Studio/unix-router)（路由）/ [unix-utils](https://github.com/MengXi-Studio/unix-utils)（便利工具）/ unix-request（网络请求），三者工程范式一致、文档体系同构。

## 本指南如何带你「从入门到精通」

| 阶段 | 主题 | 你将掌握 |
| --- | --- | --- |
| 🟢 **入门** | [介绍](./introduction) → [安装](./installation) → [快速开始](./getting-started) | 从零跑通第一个请求：安装插件、配置全局 baseURL、发起 GET 并处理响应与错误 |
| 🟢 **核心功能** | [发起请求](./requests) → [请求配置](./request-config) → [参数与请求头](./params-and-headers) → [响应结构](./response-schema) → [多实例与全局默认](./instances) | 主入口与七种快捷方法、RequestConfig 全字段与三级合并、params / header 合并规则、ResponseResult 结构、多实例隔离与 configureRequest |
| 🟡 **进阶** | [拦截器](./interceptors) → [请求与响应转换](./transform) → [取消请求](./cancel) → [错误处理](./error-handling) | 拦截器链与错误三路径、transform 替换内置行为、CancelSource 确定性取消、八类错误码分类处理 |
| 🔴 **精通** | [请求流程原理](./request-flow) → [平台兼容性](./compatibility) → [常见问题](./faq) | 一次请求的完整内部管线、各端差异与验证口径、高频坑排查 |

> **提示**：代码仓库内的 `packages/playground` 是可直接运行的 uni-app x 工程，内含 15 个功能自检页（URL 与参数 / 请求方法 / 拦截器 / 取消 / 错误码等），可边看文档边对照验证。

## 核心能力一览

| 能力 | 说明 |
| --- | --- |
| Promise API | `request<T>(config)` 返回 `Promise<ResponseResult<T>>`，失败统一 reject `RequestError`；泛型 T 为 data 提供静态类型标注 |
| 快捷方法 | get / post / put / patch / del（delete 为 UTS 保留字）/ head / options，method 由方法名固定注入 |
| 多实例 | `createRequest(defaults)` 创建 defaults 与拦截器注册表互相隔离的实例；默认实例经 `configureRequest` 设置全局默认 |
| 拦截器 | 请求拦截器变换 config；响应拦截器支持恢复 / 换错 / 放行三条错误路径；多枚、有序、可 eject |
| 配置合并 | 内置默认 → 实例默认 → 请求级三级合并；header 浅合并；baseURL 拼接双侧斜杠容错 |
| params | 库内确定性 URL 编码（`encodeURIComponent`），与 url 既有 query 合并；GET/HEAD 的 UTSJSONObject data 自动并入 query |
| 统一错误 | `RequestError` 对标 AxiosError：8 类错误码 + config / response 挂载 + 原生 errCode 原值透传 |
| 取消 | `createCancelSource()` 库内确定性 abort，token 可关联多个请求一次性取消 |
| transform | `transformRequest` / `transformResponse` 请求级提供即替换内置；内置补设 `application/json` |
| 原生透传 | enableQuic / sslVerify / withCredentials / firstIpv4 / enableChunked 全量透传不抹平；`onTask` 逃生舱可拿原生 RequestTask |
| 默认值 | 默认超时 60000 毫秒（`DEFAULT_TIMEOUT`）、默认方法 GET（`DEFAULT_METHOD`）、默认状态码校验 2xx |

## 下一步

- 想立即动手？从[安装](./installation)或[快速开始](./getting-started)开始。
- 追求先理解再使用？直接阅读[请求流程原理](./request-flow)。
- 查阅某个 API 的精确签名？前往左侧「API」分栏（如 [request()](../api/request)、[拦截器 API](../api/interceptors)）。
