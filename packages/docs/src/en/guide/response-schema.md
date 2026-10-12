# Response Schema

Every request method resolves with the same structure `ResponseResult<T>`, mirroring the Axios response schema.

## Field Overview

| Field | Type | Description |
| --- | --- | --- |
| `data` | `T` | Response body. Already JSON.parsed by the native layer when `dataType` is `json` (default); the generic T is a static annotation (see below) |
| `statusCode` | `number` | HTTP status code |
| `header` | `any` | Response headers (returned as-is by the native layer; the shape varies per platform — null-check when reading) |
| `cookies` | `Array<string>` | Response cookies |
| `config` | `RequestConfig \| null` | The **final merged config** of this request (the send snapshot, see [Request Flow](./request-flow)) |

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestConfig } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', null).then((res) => {
	console.log('statusCode=' + res.statusCode.toString())
	console.log('data=' + JSON.stringify(res.data))
	const cfg = res.config
	if (cfg != null) {
		console.log('url=' + cfg.url) // the full request URL
	}
})
```

::: tip What's inside config
`res.config` is the normalized output: `url` is already the fully joined address, `params` is cleared (encoded into the url), GET/HEAD `data` is `null`, and `header` is the merged result. It is the first place to look when debugging "what the request actually looked like".
:::

## The Generic T Is Only a Static Annotation

The generic `T` of `request<T>` / the shortcut methods only provides a static type annotation of the consumer's TS view for `res.data`; **at runtime data flows as `any`**, with no runtime validation or conversion:

```uts
type UserInfo = {
	id: number
	name: string
}

get<UserInfo>('/api/user/1', null).then((res) => {
	console.log(res.data.name) // the static hint is string; whether it really is a string at runtime is up to the server
})
```

Response types in instance methods and interceptors are `ResponseAny` (i.e. `ResponseResult<any>`); assert on the business side as needed:

```uts
import { createRequest } from '@/uni_modules/ux-request'

const inst = createRequest(null)
inst.get('/api/user/1', null).then((res) => {
	const user = res.data as UserInfo
	console.log(user.name)
})
```

## The Shape of data

The shape of `data` is determined by the request config:

| Scenario | Shape of data |
| --- | --- |
| Default (`dataType: 'json'`) | The object after native JSON.parse (usually a `UTSJSONObject`) |
| `responseType: 'arraybuffer'` | `ArrayBuffer` (platform version differences: app-android 4.51+ / app-ios 4.61+, see [Platform Compatibility](./compatibility)) |
| Empty response body (HEAD, 204, etc.) | Normalized to an **empty object** (not `null`), keeping the non-null `data` contract |
| Other `dataType` | The native parse result passed through |

::: warning Platform Differences for Non-JSON Response Bodies
When `dataType` is `json` but the server returns invalid JSON, native parsing fails on the App side and goes to fail (classified `ERR_NATIVE`, with a JSON-parse-related `nativeErrCode`); the H5 dev-mode console may print a `SyntaxError` — that is runtime noise and the request itself is fine. See [Platform Compatibility](./compatibility) for details.
:::

## contentType and the Shape of data

Response-side parsing is controlled by `dataType` / `responseType` and is **not coupled to the server's `Content-Type`** — this library never guesses the shape of data from response headers; the native parse result passed through is always authoritative. If you need to branch on the server's `Content-Type`, read `res.header` yourself in a response interceptor or `transformResponse` (see [Interceptors](./interceptors) and [Transforming Requests & Responses](./transform)).

## statusCode and Success/Failure

Getting into `then` means `validateStatus` passed (2xx by default). So `res.statusCode` is mainly for: fine-grained logic within the success range (e.g. treating 201 / 202 differently), or range checks after customizing the validation range. 4xx / 5xx always appear in `catch` as `ERR_BAD_REQUEST` / `ERR_BAD_RESPONSE` with the raw response attached — see [Error Handling](./error-handling).

For the full type definition see the API doc [ResponseResult](../api/type-response).
