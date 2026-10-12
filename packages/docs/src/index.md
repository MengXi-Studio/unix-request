---
layout: home

title: '@meng-xi/unix-request'
titleTemplate: Unix Request 网络请求

hero:
  name: '@meng-xi/unix-request'
  text: uni-app x 网络请求
  tagline: 为 uni-app x 提供功能完善的网络请求库
  image:
    src: /logo.svg
    alt: Unix Request
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 学习路径
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-request

features:
  - icon: 🚀
    title: 发起请求
    details: request 主入口 + get / post / put / patch / del / head / options 七种快捷方法，method 由方法名固定注入；默认实例开箱即用，createRequest 多实例隔离 defaults 与拦截器注册表
  - icon: ⚙️
    title: 请求配置
    details: baseURL 自动拼接、header 浅合并、timeout 超时、validateStatus 状态码校验，内置默认 → 实例默认 → 请求级三级合并；除 url 外全部可选，空安全兜底
  - icon: 🔗
    title: 参数与请求头
    details: params 与 url 既有 query 合并，库内统一确定性编码；GET/HEAD 的 UTSJSONObject data 自动并入 query；getUri() 离线构建完整 URL 不发网络
  - icon: 🛡️
    title: 拦截器
    details: 请求/响应链支持多枚有序注册、可 eject；错误链恢复（返回响应）/ 换错（返回新错误）/ 放行（返回 null）三条路径，语义与 axios 对齐
  - icon: 🔄
    title: 请求与响应转换
    details: transformRequest / transformResponse 请求级转换，提供即替换内置行为；内置请求体自动序列化、响应体原样透传，GET/HEAD 场景 transformRequest 收到 null
  - icon: ⚠️
    title: 可预测的错误体系
    details: RequestError 统一收敛参数非法 / 配置非法 / 取消 / 超时 / 网络失败 / 状态码校验失败 / 原生失败，8 类错误码字面量联合；nativeErrCode 原值透传，config 与 response 原文挂载
  - icon: ✂️
    title: 请求取消
    details: createCancelSource() 创建取消源，token 挂到 config.cancelToken，cancel(reason) 取消关联的全部进行中请求，被取消请求以 ERR_CANCELED reject
  - icon: 🧩
    title: 逃生舱与透传
    details: onTask 拿到原生 RequestTask（chunked 分块监听等高级场景）；enableQuic / sslVerify / withCredentials / enableChunked 等原生能力参数全量透传不抹平
  - icon: 💪
    title: UTS / TypeScript 优先
    details: 泛型响应 `ResponseResult<T>` 静态标注，UTSJSONObject 参数 / 严格类型，一套 API 覆盖 Web / 微信小程序 / Android
---

## 快速上手路径

[介绍](/guide/introduction) → [快速开始](/guide/getting-started) → [发起请求](/guide/requests) → [请求配置](/guide/request-config) → [拦截器](/guide/interceptors) → [错误处理](/guide/error-handling)
