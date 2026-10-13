# Changelog

## [0.1.0] - 2026-10-12

First usable release: a network request library for uni-app x built solely on `uni.request`, with a core capability set modeled on axios.

### Added

- **Main entry `request<T>(config)`**: one object describes the full config, returns `Promise<ResponseResult<T>>` (the generic `T` provides static typing for `res.data`), and rejects uniformly with
  [`RequestError`](/en/api/type-request-error) on failure
- **Seven shortcut methods**: `get` / `post` / `put` / `patch` / `del` / `head` / `options`, with the method injected by the function name (`delete` is a reserved word in UTS, hence `del`); the shortcut config
  [`RequestQuickConfig`](/en/api/type-request-quick-config) has no `url` field — the url comes from the method parameter, so callers never pass placeholder values
- **Default instance + multiple instances**: a ready-to-use default instance with global defaults via `configureRequest`; `createRequest(defaults)` creates isolated instances (defaults and interceptor registries do not
  interfere), modeled on `axios.create`
- **Request/response interceptors**: multiple ordered registrations with `ejectInterceptor(id)` removal; the response error chain offers three paths — recover (return a response) / rethrow (return a new error) /
  pass-through (return `null`), aligned with axios semantics
- **Unified error structure [`RequestError`](/en/api/type-request-error)**: 8 literal-union error codes (`ERR_PARAM` / `ERR_CONFIG` / `ERR_CANCELED` / `ERR_TIMEOUT` / `ERR_NETWORK` / `ERR_BAD_REQUEST` /
  `ERR_BAD_RESPONSE` / `ERR_NATIVE`); the native `errCode` passes through unchanged via `nativeErrCode`, with `config` and the raw `response` attached (4xx/5xx bodies are preserved)
- **Request config**: `baseURL` joining (http(s) URLs used as-is), header shallow merge (request-level keys override), `timeout`, and `validateStatus` with three-level merging (built-in defaults → instance defaults →
  request level); everything except `url` is optional with null-safe fallbacks
- **Params and body handling**: `params` merge with the existing query in the url and are encoded deterministically in the library (`encodeURIComponent` with JSON serialization for object values); `UTSJSONObject` bodies
  of GET/HEAD are folded into the query automatically
- **Transforming**: `transformRequest` / `transformResponse` replace the built-in behavior when provided (built-in: request body auto-serialization and pass-through response; transformRequest receives `null` for
  GET/HEAD)
- **Cancellation**: `createCancelSource()` creates a cancel source; attach its `token` to `config.cancelToken` and `cancel(reason)` deterministically aborts all in-flight requests bound to it, rejecting with
  `ERR_CANCELED`
- **`getUri()`**: builds the full URL offline (including params encoding) without sending a request
- **Escape hatch `onTask`**: exposes the native `RequestTask` for advanced scenarios such as chunked transfer listening; native options like `enableQuic` / `sslVerify` / `withCredentials` / `enableChunked` pass through
  untouched

### Platform Support

- **Web**: build artifacts verified; all 15 items of the real-network test matrix passed
- **WeChat Mini Program / Android**: build artifacts verified (Android includes a cloud-packaged release build with zero errors); the 15-item matrix on the mini program awaits manual testing in DevTools and the Android
  matrix awaits real-device verification
- **iOS / HarmonyOS**: code adapted but not yet tested due to environment limits (iOS requires macOS, HarmonyOS requires DevEco Studio)
