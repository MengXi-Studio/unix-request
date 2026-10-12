# 平台兼容性

unix-request 底层唯一依赖 `uni.request`（纯编排层，无平台目录），平台差异只可能来自原生 API 本身。本篇给出验证口径与已知差异。

## 平台矩阵

| 平台 | 状态 | 验证口径 |
| --- | --- | --- |
| Web（H5） | ✅ | 编译 + 15 项运行矩阵全部通过（真实网络断言明细逐项核对，无 FAIL） |
| 微信小程序 | ✅ | 编译链路验证通过（产物按引用图导出 API），开发者工具实测矩阵持续补充 |
| Android（app-android） | ✅ | 云打包 `compileReleaseKotlin` 零错误（APK 产出成功），真机矩阵持续补充 |
| iOS（app-ios） | ⏳ 待验证 | 受 macOS 环境限制延后 |
| 鸿蒙（app-harmony） | ⏳ 待验证 | 受 DevEco Studio 环境限制延后 |

> 以上验证均基于 **HBuilderX 5.26**（2026-10）。支付宝小程序（`uni.request` 需 5.31）未纳入 v1 矩阵。

### 验证矩阵覆盖的功能面

playground 15 项自检页覆盖以下场景，Web 端断言明细逐项核对通过：

- 三级配置合并与 baseURL 拼接（绝对 / 相对 / 斜杠容错 / 缺失 `ERR_CONFIG`）；
- 8 种 method 全覆盖（`request` 主入口 + 七种快捷方法的 method 固定注入）；
- params 与 GET query 编码（空格 / 数字 / 布尔 / GET data 并入顺序）、`getUri` 编码；
- header 合并、Content-Type 补设、原生 `UTSJSONObject` data 序列化；
- `transformRequest` / `transformResponse` 替换内置、`responseType: 'arraybuffer'`；
- 超时（`ERR_TIMEOUT` + `nativeErrCode=5`）、cancelToken 取消（发送前 + 飞行中 `ERR_CANCELED`）；
- 4xx / 5xx（`ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` + response 挂载）、参数非法（`ERR_PARAM`）；
- 拦截器注册 / 移除 / 恢复 / 换错 / 放行、`createRequest` 多实例隔离、`configureRequest` 全局生效。

## uni.request 各端可用版本

| Web | 微信小程序 | Android | iOS | 鸿蒙 |
| --- | --- | --- | --- | --- |
| 4.0 | 4.41 | 3.91 | 4.11 | 4.61 |

本库以其中最高的「微信 4.41」为基线，即 **HBuilderX 4.41+** 可用；建议使用较新版本（实测环境 5.26）。

## 库内行为的一致性

编排层逻辑（三级合并、拦截器链状态机、错误归类、取消注册表、params 编码）在五端运行的是**同一套实现**，行为全端一致；跨端差异只可能出现在两类位置：

1. **原生网络栈本身**：超时 errCode 的产生时机、header 键大小写、ArrayBuffer 支持版本等（见下文已知差异）；
2. **原生能力参数的生效性**：enableQuic 等透传参数各端是否生效由原生决定（见下文）。

排查跨端问题时，先确认差异落在哪一层：库内行为问题可对照[请求流程原理](./request-flow)逐阶段核对日志；原生差异则查阅官方文档并在目标平台实测。

## 已知平台差异

### responseType 与 ArrayBuffer

- `responseType: 'arraybuffer'`：**app-android 4.51+ / app-ios 4.61+**；
- 请求体 `data` 在 app-android 只接受 `UTSJSONObject` / `string`（4.51 起支持 ArrayBuffer；iOS 4.61 起）。

### 原生透传参数

`enableQuic` / `sslVerify` / `withCredentials` / `firstIpv4` / `enableChunked` **全量透传不抹平**，各端是否生效以[官方文档](https://doc.dcloud.net.cn/uni-app-x/api/request.html)为准（本库文档不承诺逐端生效性，见[请求配置](./request-config)）。

### header 键大小写

原生可能对 header 键做小写化（hello uni-app x 官方示例含「检测 header 键是否为小写」专项测试佐证）。库内不做键大小写规范化（自动补设 `content-type` 的检查本身是大小写不敏感的），**读取响应 header 时请按需判空并兼容键大小写**。

### iOS 待验证项

iOS 端因环境限制整体延后验证，其中有一项库内已知风险：`UTSJSONObject.keys()` 官方标注的 iOS 兼容性存疑，而库内的 params 编码、header 合并、Content-Type 检查均依赖该方法。iOS 首测时将优先验证此路径；在此之前，iOS 端请勿用于生产。

### 超时与网络错误的表现

「不可路由地址 + 超时」在 App 端归类 `ERR_TIMEOUT`（`nativeErrCode = 5`）；Web 端可能表现为 `ERR_NETWORK`——以实际运行日志为准，业务判定建议同时覆盖两类 code（见[错误处理](./error-handling)）。

### 响应 header 与 cookies 的形态

`ResponseResult.header` 类型为 `any`（原生原样返回），各端具体形态（对象结构 / 键大小写）不保证一致；`cookies` 为字符串数组，部分场景可能为空。业务读取时请统一判空、按需兼容键大小写（见[响应结构](./response-schema)）。

### H5 控制台噪音

H5 **dev 模式**控制台对空响应体 / 非 JSON 文本响应体会打印 `SyntaxError`（HEAD 请求、404 文本响应等场景可见）。这是运行时噪音，**请求本身正常**（成败以 `then` / `catch` 实际走向为准）。

::: tip 遇到未覆盖的差异
playground 的 15 个自检页覆盖了 URL 参数 / 方法 / header / transform / 取消 / 错误码 / 拦截器 / 实例 / ArrayBuffer 等场景。在目标平台跑一遍 playground 是验证兼容性最快的方式，欢迎以 issue 反馈各端实测结果。
:::
