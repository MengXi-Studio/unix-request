# Platform Compatibility

unix-request depends solely on `uni.request` underneath (a pure orchestration layer with no platform directories), so platform differences can only come from the native API itself. This page gives the verification baseline and the known differences.

## Platform Matrix

| Platform | Status | Verification baseline |
| --- | --- | --- |
| Web (H5) | ✅ | Compilation + all 15 runtime matrix items passed (real-network assertion details checked item by item, no FAIL) |
| WeChat Mini Program | ✅ | Compilation pipeline verified (APIs exported per the reference graph); the matrix on developer tools keeps being extended |
| Android (app-android) | ✅ | Cloud packaging `compileReleaseKotlin` zero errors (APK produced successfully); the on-device matrix keeps being extended |
| iOS (app-ios) | ⏳ Pending | Deferred due to macOS environment limitations |
| HarmonyOS (app-harmony) | ⏳ Pending | Deferred due to DevEco Studio environment limitations |

> All verification above is based on **HBuilderX 5.26** (2026-10). Alipay Mini Program (`uni.request` requires 5.31) is not part of the v1 matrix.

### What the Verification Matrix Covers

The playground's 15 self-check pages cover the following scenarios; the Web-side assertion details were checked item by item and passed:

- Three-level config merging and baseURL joining (absolute / relative / slash tolerance / missing `ERR_CONFIG`);
- All 8 methods covered (the `request` main entry + the method fixed injection of the seven shortcut methods);
- params and GET query encoding (spaces / numbers / booleans / GET data merge order), `getUri` encoding;
- header merging, the Content-Type default, native `UTSJSONObject` data serialization;
- `transformRequest` / `transformResponse` replacing the built-in, `responseType: 'arraybuffer'`;
- Timeout (`ERR_TIMEOUT` + `nativeErrCode=5`), cancelToken cancellation (pre-send + in-flight `ERR_CANCELED`);
- 4xx / 5xx (`ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` + response attachment), invalid parameters (`ERR_PARAM`);
- Interceptor registration / removal / recover / replace the error / pass through, `createRequest` multi-instance isolation, `configureRequest` global effect.

## uni.request Availability per Platform

| Web | WeChat Mini Program | Android | iOS | HarmonyOS |
| --- | --- | --- | --- | --- |
| 4.0 | 4.41 | 3.91 | 4.11 | 4.61 |

This library takes the highest of them, "WeChat 4.41", as its baseline, i.e. **HBuilderX 4.41+**; a newer version is recommended (verified on 5.26).

## Consistency of In-Library Behavior

The orchestration logic (three-level merging, the interceptor chain state machine, error classification, the cancellation registry, params encoding) runs the **same implementation** on all five platforms and behaves identically everywhere; cross-platform differences can only appear in two places:

1. **The native network stack itself**: when the timeout errCode is produced, header key casing, the versions supporting ArrayBuffer, etc. (known differences below);
2. **Whether native capability parameters take effect**: whether pass-through parameters like enableQuic take effect on each platform is decided natively (see below).

When troubleshooting cross-platform issues, first determine which layer the difference falls in: for in-library behavior, compare logs stage by stage against [Request Flow](./request-flow); for native differences, consult the official documentation and test on the target platform.

## Known Platform Differences

### responseType and ArrayBuffer

- `responseType: 'arraybuffer'`: **app-android 4.51+ / app-ios 4.61+**;
- On app-android the request body `data` only accepts `UTSJSONObject` / `string` (ArrayBuffer supported from 4.51; from 4.61 on iOS).

### Native Pass-Through Parameters

`enableQuic` / `sslVerify` / `withCredentials` / `firstIpv4` / `enableChunked` are **passed through in full without smoothing**; whether they take effect on each platform is subject to the [official documentation](https://doc.dcloud.net.cn/uni-app-x/api/request.html) (this documentation makes no per-platform effectiveness promises, see [Request Config](./request-config)).

### header Key Casing

The native layer may lowercase header keys (the official hello uni-app x example includes a dedicated test for "whether header keys are lowercase"). The library does no key-case normalization (the automatic `content-type` check itself is case-insensitive); **when reading the response header, null-check as needed and tolerate key casing**.

### Pending iOS Verification

iOS verification is deferred as a whole due to environment constraints. One known in-library risk: the officially documented iOS compatibility of `UTSJSONObject.keys()` is in doubt, and the library's params encoding, header merging, and Content-Type check all rely on that method. This path will be verified first in iOS initial testing; until then, do not use the library in production on iOS.

### Timeout and Network Error Behavior

"Unroutable address + timeout" classifies as `ERR_TIMEOUT` on the App side (`nativeErrCode = 5`) but may surface as `ERR_NETWORK` on Web — trust the actual runtime logs; business checks are advised to cover both codes (see [Error Handling](./error-handling)).

### The Shape of the Response header and cookies

`ResponseResult.header` is typed `any` (returned as-is by the native layer); its concrete shape per platform (object structure / key casing) is not guaranteed consistent; `cookies` is a string array and may be empty in some scenarios. Null-check uniformly when reading and tolerate key casing as needed (see [Response Schema](./response-schema)).

### H5 Console Noise

The H5 **dev mode** console prints `SyntaxError` for empty response bodies / non-JSON text response bodies (visible with HEAD requests, 404 text responses, etc.). This is runtime noise; **the request itself is fine** (judge success/failure by the actual `then` / `catch` path).

::: tip When You Hit an Uncovered Difference
The playground's 15 self-check pages cover URL params / methods / headers / transform / cancellation / error codes / interceptors / instances / ArrayBuffer and more. Running the playground once on the target platform is the fastest compatibility check; issue reports of per-platform results are welcome.
:::
