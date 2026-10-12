# Introduction

`@meng-xi/unix-request` (uni_modules plugin ID: `ux-request`) is a network request library for **uni-app x** by MengXi-Studio. Its API model fully mirrors **Axios**, it is written in **UTS** (`.uts`), and it depends solely on the official `uni.request` underneath — it does not reinvent the network stack, it only builds the orchestration layer.

## Why You Need It

`uni.request` is the official native network API. Using it directly leads to a series of structural pain points once your business grows:

| uni.request pain point | How this library addresses it |
| --- | --- |
| Callback-style API (`success / fail / complete`), no Promise, no generics, no method aliases | `request<T>(config)` returns `Promise<ResponseResult<T>>`; failures uniformly reject `RequestError`; seven shortcut methods included |
| HTTP 4xx / 5xx still go through the `success` callback, so every call site checks `statusCode` manually | `validateStatus` defaults to 2xx; failures reject with `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` and attach the raw response |
| Two separate error systems: network-layer errors (native `errCode`) and HTTP-layer errors | Unified `RequestError`: 8 error codes + `nativeErrCode` pass-through of the original value + config / response attachment |
| No interceptors; token injection / logging / reporting can only be copy-pasted | Request / response interceptor chains: multiple, ordered, ejectable; errors can be recovered / replaced / passed through |
| No cancellation wrapper; `RequestTask.abort()` requires holding references yourself with uncertain semantics | `createCancelSource()` for deterministic in-library abort; one token can cancel multiple requests |
| No `baseURL` / `params` / default config / multi-instance hierarchy | Three-level config merging (built-in defaults → instance defaults → request level) + `createRequest` multi-instance |
| No documented encoding rule for GET data → query, no cross-platform consistency guarantee | `params` encoded deterministically in-library (`encodeURIComponent`); merging GET/HEAD data into query is an explicit contract |

unix-request's API model fully mirrors **Axios**, absorbing these pain points in one go, all built on top of `uni.request`.

## Who Is It For

- **uni-app x developers struggling with uni.request callbacks and scattered config**: who want Promise-based calls, unified errors, and centralized configuration.
- **Teams migrating from Axios or axios-style request libraries**: the mental model of interceptors, instances, transform, and cancellation carries over as-is.
- **Projects that need consistent request behavior across Web / Mini Program / App**: one API set covers multiple platforms, with platform differences confined to a handful of native pass-through parameters.

## Smoothing the Boundary: What This Library Does and Doesn't

- **Layer 1 · Orchestration layer (fully handled by this library)**: the instance system, interceptor chains, transform, params, unified errors, cancellation, three-level config merging — the full Axios feature set.
- **Layer 2 · Network stack layer (passed through as-is)**: capabilities like QUIC / chunked / cookie / request body serialization fully reuse the official native `uni.request` implementation; this library does not smooth them over, exposes them as-is, and documents them.

In other words: everything about how a request is prepared before it goes out is fully handled by this library; how the network itself works is left to the official native layer.

## Explicit Non-Goals (v1)

Knowing the boundary matters as much as knowing the capabilities. The following are out of scope for v1:

- `uni.uploadFile` / `uni.downloadFile` wrappers, upload/download progress;
- **Built-in implementations** of request retry, loading indicators, and seamless token refresh (all three can be built on interceptors; see [Interceptors](./interceptors) for the implementation path);
- Built-in unwrapping of the business `code` (keep the HTTP layer and business layer separate; implement it yourself with a response interceptor or `transformResponse`);
- `auth` (Basic) / proxy / custom `paramsSerializer` / replaceable adapter.

## Project Shape

- **Standard uni_modules UTS plugin**: npm package name `@meng-xi/unix-request`, uni_modules plugin ID `ux-request`, the official `utssdk/` directory structure + `interface.uts` public declarations;
- **UTS source distribution**: compiled on-site per target platform by the uni-app x toolchain (Web / Mini Program → JS, Android → Kotlin, iOS → Swift), with no runtime bridging overhead;
- **Pure orchestration layer**: `uni.request` is unified across all platforms; the plugin contains no platform directories; one implementation covers all five platforms;
- **playground self-check project**: `packages/playground` in the repository contains 15 capability self-check pages covering every capability documented here.

unix-request is the third member of the MengXi-Studio tool matrix: [unix-router](https://github.com/MengXi-Studio/unix-router) (routing) / [unix-utils](https://github.com/MengXi-Studio/unix-utils) (utilities) / unix-request (network requests). The three share consistent project conventions and isomorphic documentation systems.

## How This Guide Takes You from Beginner to Mastery

| Stage | Topics | What you'll master |
| --- | --- | --- |
| 🟢 **Getting Started** | [Introduction](./introduction) → [Installation](./installation) → [Quick Start](./getting-started) | Run your first request from scratch: install the plugin, set the global baseURL, make a GET request and handle the response and errors |
| 🟢 **Core Features** | [Making Requests](./requests) → [Request Config](./request-config) → [Params & Headers](./params-and-headers) → [Response Schema](./response-schema) → [Instances & Global Defaults](./instances) | The main entry and seven shortcut methods, every RequestConfig field and three-level merging, params / header merging rules, the ResponseResult structure, multi-instance isolation and configureRequest |
| 🟡 **Advanced** | [Interceptors](./interceptors) → [Transforming Requests & Responses](./transform) → [Cancellation](./cancel) → [Error Handling](./error-handling) | Interceptor chains and the three error paths, transform replacing built-in behavior, deterministic cancellation with CancelSource, handling the 8 error codes |
| 🔴 **Mastery** | [Request Flow](./request-flow) → [Platform Compatibility](./compatibility) → [FAQ](./faq) | The complete internal pipeline of a request, per-platform differences and verification baselines, troubleshooting high-frequency pitfalls |

> **Tip**: `packages/playground` in the repository is a runnable uni-app x project containing 15 capability self-check pages (URL and params / request methods / interceptors / cancellation / error codes, etc.). Verify as you read.

## Capabilities at a Glance

| Capability | Description |
| --- | --- |
| Promise API | `request<T>(config)` returns `Promise<ResponseResult<T>>`; failures uniformly reject `RequestError`; the generic T provides static typing for data |
| Shortcut methods | get / post / put / patch / del (`delete` is a UTS reserved word) / head / options; the method is fixed by the method name |
| Multi-instance | `createRequest(defaults)` creates instances with mutually isolated defaults and interceptor registries; the default instance's global defaults are set via `configureRequest` |
| Interceptors | Request interceptors transform config; response interceptors support three error paths — recover / replace the error / pass through; multiple, ordered, ejectable |
| Config merging | Built-in defaults → instance defaults → request-level three-level merging; headers shallow-merged; baseURL joining tolerates slash combinations on both sides |
| params | Deterministic in-library URL encoding (`encodeURIComponent`), merged with the url's existing query; UTSJSONObject data of GET/HEAD is automatically merged into the query |
| Unified errors | `RequestError` mirrors AxiosError: 8 error codes + config / response attachment + native errCode passed through with its original value |
| Cancellation | `createCancelSource()` for deterministic in-library abort; a token can be associated with multiple requests and cancel them all at once |
| transform | `transformRequest` / `transformResponse` are request-level and replace the built-in when provided; the built-in sets `application/json` when missing |
| Native pass-through | enableQuic / sslVerify / withCredentials / firstIpv4 / enableChunked are passed through fully without smoothing; the `onTask` escape hatch gives you the native RequestTask |
| Defaults | Default timeout 60000 ms (`DEFAULT_TIMEOUT`), default method GET (`DEFAULT_METHOD`), default status validation 2xx |

## Next Steps

- Want to get hands-on right away? Start with [Installation](./installation) or [Quick Start](./getting-started).
- Prefer to understand before using? Read [Request Flow](./request-flow) directly.
- Looking for a precise API signature? Check the "API" section in the left sidebar (e.g. [request()](../api/request), [Interceptor API](../api/interceptors)).
