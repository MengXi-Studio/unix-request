# 更新日志

## [0.1.0] - 2026-10-12

### 新增

- 首个可用版本：默认实例 + 多实例（`createRequest`），请求/响应拦截器（多枚有序、可 eject、错误可恢复/换错/放行）、统一错误结构 `RequestError`、baseURL / header 合并 / params 编码 / transform / validateStatus / timeout / 取消请求（`createCancelSource`）等核心能力
- 七种快捷方法：get / post / put / patch / del / head / options，method 由方法名固定注入
- `getUri()` 离线构建完整 URL（含 params 编码）；`onTask` 逃生舱透出原生 RequestTask
- 覆盖平台：Web / 微信小程序 / Android（iOS、鸿蒙待验证）
