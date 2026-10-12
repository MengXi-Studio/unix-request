---
layout: home

title: '@meng-xi/unix-request'
titleTemplate: Unix Request HTTP Client

hero:
  name: '@meng-xi/unix-request'
  text: HTTP requests for uni-app x
  tagline: A full-featured HTTP request library for uni-app x
  image:
    src: /logo.svg
    alt: Unix Request
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/getting-started
    - theme: alt
      text: Learning Path
      link: /en/guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-request

features:
  - icon: 🚀
    title: Making Requests
    details: A request entry plus seven shortcut methods (get / post / put / patch / del / head / options) with the method injected by the function name; a ready-to-use default instance and createRequest() for isolated instances
  - icon: ⚙️
    title: Request Config
    details: baseURL joining, header shallow merge, timeout and validateStatus with three-level merging (built-in defaults → instance defaults → request level); everything except url is optional with null-safe fallbacks
  - icon: 🔗
    title: Params & Headers
    details: params merge with existing query in the url and are encoded deterministically in the library; UTSJSONObject data of GET/HEAD is folded into the query; getUri() builds the full URL offline
  - icon: 🛡️
    title: Interceptors
    details: Request/response chains support multiple ordered registrations with eject; the error chain offers recover (return a response), rethrow (return a new error) and pass-through (return null), aligned with axios semantics
  - icon: 🔄
    title: Transforming
    details: Request-level transformRequest / transformResponse replace the built-in behavior when provided; built-in request body auto-serialization and pass-through response, with transformRequest receiving null for GET/HEAD
  - icon: ⚠️
    title: Predictable Errors
    details: RequestError unifies invalid params/config, cancellation, timeout, network failure, status validation failure and native failures into 8 literal-union codes; nativeErrCode passes through unchanged, config and response are attached
  - icon: ✂️
    title: Cancellation
    details: createCancelSource() creates a cancel source; attach its token to config.cancelToken and cancel(reason) aborts all in-flight requests bound to it, rejecting with ERR_CANCELED
  - icon: 🧩
    title: Escape Hatches
    details: onTask exposes the native RequestTask for advanced scenarios such as chunked transfer listening; native options like enableQuic / sslVerify / withCredentials / enableChunked pass through untouched
  - icon: 💪
    title: UTS / TypeScript First
    details: Generically-typed `ResponseResult<T>`, UTSJSONObject params and strict types; one API surface covering Web, WeChat Mini Program and Android
---

## Quick Start Path

[Introduction](/en/guide/introduction) → [Quick Start](/en/guide/getting-started) → [Making Requests](/en/guide/requests) → [Request Config](/en/guide/request-config) → [Interceptors](/en/guide/interceptors) → [Error Handling](/en/guide/error-handling)
