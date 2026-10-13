[中文](./README.md) | **English**

<div align="center">
  <a href="https://github.com/MengXi-Studio/unix-request">
    <img alt="MengXi Studio Logo" width="215" src="https://github.com/MengXi-Studio/unix-request/blob/master/packages/docs/src/public/logo.png">
  </a>
  <a href="https://github.com/MengXi-Studio/unix-request">
    <img alt="WeChat Official Account QR Code" width="215" src="https://github.com/MengXi-Studio/unix-request/blob/master/packages/docs/src/public/QR_code.jpg">
  </a>
  <br>
  <h1>@meng-xi/unix-request</h1>
  <p>A full-featured HTTP request library for uni-app x (written in UTS, one API across platforms)</p>

[![license](https://img.shields.io/github/license/MengXi-Studio/unix-request.svg)](LICENSE) [![npm](https://img.shields.io/npm/v/@meng-xi/unix-request?color=blue)](https://www.npmjs.com/package/@meng-xi/unix-request)
![npm](https://img.shields.io/npm/dt/@meng-xi/unix-request?color=green)

</div>

## Why unix-request

Writing business code directly on `uni.request` means re-implementing URL joining, header merging, timeout and cancellation, and taming a zoo of failure shapes — again in every project. unix-request folds all of that
into one library:

- **Used axios before?** Interceptors, transforms, cancellation and error codes share the same mental model — glance at the API and you're productive;
- **Shipping to multiple platforms?** One codebase for Web / WeChat Mini Program / Android, with URL encoding and error classification implemented deterministically in the library — no per-platform debugging;
- **Care about types?** Generic `request<T>` responses and literal-union error codes, with full UTS / TypeScript IntelliSense.

The only underlying dependency is `uni.request` — no reinvented network stack; distributed as UTS source (Web / Mini Program → JS, Android → Kotlin, iOS → Swift), compiled on the fly by the uni-app x build chain.

## Features

- **axios mental model, ready out of the box** - A `request` entry plus seven shortcut methods `get` / `post` / `put` / `patch` / `del` / `head` / `options` (method injected by the function name), a ready-to-use default
  instance, and isolated instances via `createRequest`
- **Unified, predictable errors** - `RequestError` collapses failures into 8 error codes (invalid params / config / canceled / timeout / network / 4xx / 5xx / native), with the native `errCode` passed through unchanged
  and `config` plus the raw `response` attached
- **Generic static typing** - `request<T>` returns `Promise<ResponseResult<T>>`; the type of `res.data` flows straight through, friendly to both UTS and TS
- **Deterministic URL and params handling** - Automatic `baseURL` joining, `params` merged with the existing url query and encoded in one place, GET/HEAD bodies folded into the query automatically, and three-level header
  shallow merging (built-in defaults → instance defaults → request level)
- **Request & response interceptors** - Multiple ordered registrations with eject; the response error chain offers recover / rethrow / pass-through paths
- **Cancellation** - `createCancelSource()` creates a cancel source that deterministically aborts all bound in-flight requests, rejecting recognizably with `ERR_CANCELED`
- **Strongly typed UTS** - Every field except `url` is optional with null-safe fallbacks; `method` and error codes are literal unions; the `onTask` escape hatch exposes the native `RequestTask`, and native options pass
  through untouched

## Installation

**npm** — install, then copy the package into your project's `uni_modules/ux-request/` (the compiler does not scan node_modules):

```bash
pnpm add @meng-xi/unix-request
mkdir -p uni_modules && cp -R node_modules/@meng-xi/unix-request uni_modules/ux-request
```

> `packages/core` is a standard **uni_modules UTS plugin** (`utssdk/` official directory layout + `interface.uts` API declarations); import from `@/uni_modules/ux-request` in your code.

## Quick Start

### 1. Send your first request

```uts
import { request, configureRequest } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

// Configure global defaults once at startup (e.g. App.uvue onLaunch; null keeps built-in defaults)
configureRequest({
	baseURL: 'https://your.api',
	timeout: 10000,
	header: null,
	validateStatus: null
})

// Send the request: the generic types res.data
request<UTSJSONObject>({
	url: '/api/http/method/get', // relative paths are joined with baseURL
	method: 'GET',
	params: { page: 1 } as UTSJSONObject // deterministically encoded into the query
}).then((res) => {
	console.log('statusCode=' + res.statusCode.toString()) // 200
	console.log(res.data)
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code, e.errMsg)
})
```

### 2. Seven shortcut methods

```uts
import { get, post } from '@/uni_modules/ux-request'

// GET: the method is injected by the function name; the shortcut config has no url field
get<UTSJSONObject>('/api/http/method/get', {
	params: { page: 1 } as UTSJSONObject
}).then((res) => {
	console.log(res.statusCode)
})

// POST: object bodies are serialized automatically
post<UTSJSONObject>('/login', { user: 'demo' } as UTSJSONObject, null).then((res) => {
	console.log(res.data)
})
```

### 3. Unified error handling

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<UTSJSONObject>({ url: '/may-fail' }).catch((err) => {
	const e = err as RequestError
	if (e.code == 'ERR_CANCELED') {
		// canceled (the createCancelSource reason is in e.errMsg)
	} else if (e.code == 'ERR_TIMEOUT') {
		// timeout (native errCode 5 passes through via e.nativeErrCode)
	} else if (e.code == 'ERR_BAD_REQUEST') {
		// HTTP 4xx: e.statusCode + e.response carry the raw response
	} else {
		// the rest: ERR_PARAM / ERR_CONFIG / ERR_NETWORK / ERR_BAD_RESPONSE / ERR_NATIVE
	}
})
```

### What it looks like

Screenshots come from the bundled demo app [packages/playground](https://github.com/MengXi-Studio/unix-request/tree/master/packages/playground) (11 pages covering every feature as a runnable verification matrix on H5 /
Mini Program / Android):

<p align="center">
  <img alt="All seven methods hitting statusCode=200 on real requests" width="720" src="https://github.com/MengXi-Studio/unix-request/blob/master/packages/docs/src/public/screenshot-methods.png">
</p>

**Android on-device demo**: [download the demo APK](https://mp-b8b8347a-48e9-434d-8302-3e9d99c2cb01.cdn.bspapp.com/cloudstorage/app-build-pkg/1791810317449-__UNI__1927897_1791810302753.apk) — the cloud-packaged build of
the playground above; install it to run the full case matrix on a real device.

## Community & Support

Want the design rationale and implementation details (cross-platform UTS generics, the unified error taxonomy, deterministic abort for cancellation)? The WeChat official account「**梦曦工作室** / MengXi Studio」has a
series of deep dives — scan the QR code to follow:

<p align="center">
  <img alt="WeChat Official Account QR Code" width="180" src="https://github.com/MengXi-Studio/unix-request/blob/master/packages/docs/src/public/QR_code.jpg">
</p>

- 📖 [Documentation](https://mengxi-studio.github.io/unix-request/) (guides + API reference + changelog, bilingual)
- 🐛 [Issues](https://github.com/MengXi-Studio/unix-request/issues) / 💬 [Discussions](https://github.com/MengXi-Studio/unix-request/discussions)

## Exports

- API: `request` / `get` / `post` / `put` / `patch` / `del` / `head` / `options` / `getUri` / `useRequestInterceptor` / `useResponseInterceptor` / `ejectInterceptor` / `configureRequest` / `createRequest` /
  `createCancelSource`
- Constants: `DEFAULT_TIMEOUT` / `DEFAULT_METHOD` / `REQUEST_ERR_SUBJECT`
- Types: `RequestConfig` / `RequestQuickConfig` / `RequestDefaults` / `ResponseResult` / `ResponseAny` / `RequestError` / `RequestErrorCode` / `RequestInstance` / `RequestMethod` / `CancelToken` / `CancelSource`

## Documentation

📖 Complete documentation (guides + API reference + changelog):

**[https://mengxi-studio.github.io/unix-request/](https://mengxi-studio.github.io/unix-request/)**

Suggested reading: start with the [Introduction](https://mengxi-studio.github.io/unix-request/en/guide/introduction.html) and [Quick Start](https://mengxi-studio.github.io/unix-request/en/guide/getting-started.html),
then dive into the core chain with [Making Requests](https://mengxi-studio.github.io/unix-request/en/guide/requests.html) → [Interceptors](https://mengxi-studio.github.io/unix-request/en/guide/interceptors.html) →
[Error Handling](https://mengxi-studio.github.io/unix-request/en/guide/error-handling.html); for API details see the [API Reference](https://mengxi-studio.github.io/unix-request/en/api/request.html).

## Changelog

📝 **[https://github.com/MengXi-Studio/unix-request/blob/master/packages/docs/src/changelog.md](https://github.com/MengXi-Studio/unix-request/blob/master/packages/docs/src/changelog.md)**

## License

[MIT](LICENSE)
