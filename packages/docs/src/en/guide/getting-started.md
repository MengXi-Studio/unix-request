# Quick Start

This page walks you through your first request from scratch: set global defaults → make a GET request → handle the response and errors. It assumes you have completed [Installation](./installation).

## Step 1: Set Global Defaults

It is recommended to set the default instance's global defaults (baseURL / timeout / default header) via `configureRequest` in `onLaunch` of `App.uvue`:

```uts
// inside App.uvue <script setup lang="uts">
import { configureRequest } from '@/uni_modules/ux-request'

onLaunch(() => {
	const header: UTSJSONObject = {}
	header['x-app'] = 'my-app'
	configureRequest({
		baseURL: 'https://request.dcloud.net.cn',
		timeout: 15000,
		header: header,
		validateStatus: null
	})
})
```

> All 4 fields of `RequestDefaults` (baseURL / timeout / header / validateStatus) may be `null`: `null` means the built-in defaults apply (GET / 60000 ms / no header / 2xx validation). See [Instances & Global Defaults](./instances) for details.

## Step 2: Make a Request

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', null)
	.then((res) => {
		console.log('statusCode=' + res.statusCode.toString())
		console.log('data=' + JSON.stringify(res.data))
	})
	.catch((err) => {
		const e = err as RequestError
		console.log('code=' + e.code + ' errMsg=' + e.errMsg)
	})
	.finally(() => {
		// runs whether it succeeds or fails (hide loading, etc.)
	})
```

Key points:

- The relative path `/api/http/method/get` is automatically joined with the global `baseURL`;
- The payload received by `.catch` is the unified error structure; in UTS, assert with `err as RequestError` and branch by `code`;
- HTTP 4xx / 5xx reject directly (`ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE`), **no manual `statusCode` checks needed** — data in the success callback is always a "business-usable" response.

## Requests with Types and Params

```uts
type UserInfo = {
	id: number
	name: string
}

get<UserInfo>('/api/user/1', {
	params: { withDetail: true } as UTSJSONObject
}).then((res) => {
	console.log(res.data.name) // the generic T gives static hints: the compiler knows data is UserInfo
})
```

> The generic `T` only provides a static type annotation for `res.data`; at runtime data flows as `any`. See [Response Schema](./response-schema) for details.

## POST Requests

```uts
import { post } from '@/uni_modules/ux-request'

post<any>('/api/user/create', { name: 'mengxi', role: 'admin' } as UTSJSONObject, null)
	.then((res) => {
		console.log('statusCode=' + res.statusCode.toString())
	})
```

- `data` is passed through to `uni.request` as-is; request body serialization is handled natively;
- When data is a `UTSJSONObject` and `content-type` is not explicitly set, the library sets `application/json` automatically (see [Transforming Requests & Responses](./transform) for details).

## Complete Example

Putting the three steps together in one page (same structure as the playground, runs as-is):

```uts
import { get, configureRequest } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

configureRequest({
	baseURL: 'https://request.dcloud.net.cn',
	timeout: 15000,
	header: null,
	validateStatus: null
})

get<any>('/api/http/method/get', { params: { from: 'quick-start' } as UTSJSONObject })
	.then((res) => {
		console.log('ok statusCode=' + res.statusCode.toString())
	})
	.catch((err) => {
		const e = err as RequestError
		console.log('fail code=' + e.code + ' errMsg=' + e.errMsg)
	})
```

## Next Steps

- The seven shortcut methods and everything the `request` main entry can do → [Making Requests](./requests)
- The exact semantics of every config field and three-level merging → [Request Config](./request-config)
- What you get on failure and how to classify it → [Error Handling](./error-handling)
