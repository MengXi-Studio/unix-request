# Making Requests

unix-request exposes two layers of request entry points: the `request<T>(config)` main entry (a single object describes the full config) and seven shortcut methods (the method name is the HTTP method). Both return `Promise<ResponseResult<T>>` and reject with `RequestError` on failure.

## Main Entry `request<T>`

```uts
import { request } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

request<any>({
	url: '/api/http/method/get', // required; relative paths are joined with baseURL
	method: 'GET',
	params: { page: 1 } as UTSJSONObject
}).then((res) => {
	console.log('statusCode=' + res.statusCode.toString())
}).catch((err) => {
	const e = err as RequestError
	console.log(e.code)
})
```

- `url` is the only required field; everything else is optional (omitted or `null` uses the instance defaults);
- Returns `Promise<ResponseResult<T>>`; the generic T provides static typing for `res.data`;
- Failures uniformly reject `RequestError`; the 8 error codes are covered in [Error Handling](./error-handling).

For the full signature see the API docs [request()](../api/request) and [RequestConfig](../api/type-request-config).

## Seven Shortcut Methods

| Method | Signature | HTTP method |
| --- | --- | --- |
| `get<T>` | `(url, config \| null)` | GET |
| `post<T>` | `(url, data \| null, config \| null)` | POST |
| `put<T>` | `(url, data \| null, config \| null)` | PUT |
| `patch<T>` | `(url, data \| null, config \| null)` | PATCH |
| `del<T>` | `(url, config \| null)` | DELETE |
| `head<T>` | `(url, config \| null)` | HEAD |
| `options<T>` | `(url, config \| null)` | OPTIONS |

```uts
import { get, post, del } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', null)
post<any>('/api/http/method/post', { name: 'mengxi' } as UTSJSONObject, null)
del<any>('/api/http/method/delete', null)
```

Two hard constraints:

1. **The method is fixed by the method name**. The shortcut method config type is [RequestQuickConfig](../api/type-request-quick-config) — it has **no url field** (the url comes from the method argument, so business code never passes a placeholder just to satisfy a required url); its `method` field is not passed through, the actual method always equals the method name. Use the `request` main entry when you need a custom method.
2. **`del` is named that because `delete` is a UTS reserved word**; it means DELETE, and instance methods work the same way.

## Request-Level Overrides and the Default Instance

Any request-level field can override the instance defaults and only affects the current request:

```uts
import { get } from '@/uni_modules/ux-request'

// the global baseURL points at the business service; this one request hits another machine with a relaxed timeout
get<any>('https://other.example.com/api/slow', {
	timeout: 3000,
	header: { 'x-trace': 'on' } as UTSJSONObject // shallow-merged with the global header; same-name keys override
}).then((res) => {
	console.log(res.statusCode.toString())
})
```

For the merging rules (built-in defaults → instance defaults → request level) see [Request Config](./request-config); to persist "config you write every time", see [Instances & Global Defaults](./instances).

## Where Does data Go

- **POST / PUT / PATCH**: `data` is passed to the native layer as the request body (`UTSJSONObject` / `string` / `ArrayBuffer`; App-side type restrictions see [Platform Compatibility](./compatibility));
- **GET / HEAD**: when `data` is a `UTSJSONObject` it is automatically encoded into the URL query; after normalization the request body is always `null` — this is the library's explicit contract (the official docs define no GET data encoding rule). See [Params & Headers](./params-and-headers) for details.

## Error Handling Overview

Shortcut methods and the `request` main entry share the exact same failure path: they reject the same `RequestError`, carrying 8 error codes, the native errCode, the HTTP status code, and the raw response:

```uts
request<any>({ url: '/api/http/statusCode/404' }).catch((err) => {
	const e = err as RequestError
	// e.code === 'ERR_BAD_REQUEST'
	// e.statusCode === 404
	// e.response!.data === the server's 404 response body
})
```

For systematic handling see [Error Handling](./error-handling).

## Next Steps

- The semantics of every config field and three-level merging → [Request Config](./request-config)
- The complete structure of the response object → [Response Schema](./response-schema)
- The exact signatures of the shortcut methods → API docs [Shortcut Methods](../api/quick-methods)
