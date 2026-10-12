# Params & Headers

This page covers the deterministic encoding rules for `params`, the contract of merging GET/HEAD request bodies into the query, the shallow-merge rules for `header`, and offline URL building with `getUri`.

## params: Query Params

`params` is a field the official `uni.request` does not have. The official implicit "GET data → query" conversion has no documented encoding rule (no guarantee on the encoding method / nested object handling / cross-platform consistency), so this library provides `params` with **deterministic in-library encoding** instead of relying on the native implicit behavior:

```uts
import { get } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', {
	params: { page: 1, keyword: 'meng xi', active: true } as UTSJSONObject
})
// actual request: GET /api/http/method/get?page=1&keyword=meng%20xi&active=true
```

Encoding rules (both keys and values go through `encodeURIComponent`):

| Value type | Encoding result | Example |
| --- | --- | --- |
| `string` | escaped as-is | `'a b'` → `a%20b` |
| `number` | converted to string | `1` → `1` |
| `boolean` | `true` / `false` | `true` → `true` |
| `UTSJSONObject` / arrays and other types | escaped after `JSON.stringify` | `{"x":1}` → `%7B%22x%22%3A1%7D` |
| `null` | the key is skipped | — |

## Merging with the url's Existing Query

A query already present in the url is merged with `params`, joined with `&`; a trailing orphan `?` / `&` in the url is tolerated:

```uts
import { getUri } from '@/uni_modules/ux-request'

getUri({
	url: '/api/list?size=10',
	baseURL: 'https://api.example.com',
	params: { page: 2 } as UTSJSONObject
})
// https://api.example.com/api/list?size=10&page=2
```

## GET/HEAD data Is Automatically Merged into the Query

For GET / HEAD requests, when `data` is a `UTSJSONObject` it is automatically encoded into the query (**after params**), and in the normalized output `data` is always `null`:

```uts
get<any>('/api/http/method/get', {
	params: { a: 'a b' } as UTSJSONObject,
	data: { 'from-data': 'get-body' } as UTSJSONObject
}).then((res) => {
	// res.config.url === '.../api/http/method/get?a=a%20b&from-data=get-body'
})
```

::: tip Why this design
GET with a request body is a common uni-app practice (the official hello uni-app x example includes a dedicated "detect query" test as evidence), but the official docs define no encoding rule and no cross-platform consistency guarantee. The library turns this implicit behavior into an **explicit contract**: the query is encoded uniformly by the library, data is no longer passed to the native layer, and behavior is identical across all five platforms.
:::

- GET/HEAD `data` that is not a `UTSJSONObject` is neither merged into the query nor passed to the native layer;
- This is also why a custom `transformRequest` must null-check; see [Transforming Requests & Responses](./transform).

## header: Shallow Merge

`header` is shallow-merged by key: the instance default header (`configureRequest` / instance defaults) lays the base, request-level same-name keys override, other keys are kept; the merge is written into a brand-new object and never mutates the object you passed in:

```uts
import { get } from '@/uni_modules/ux-request'

get<any>('/api/http/method/get', {
	header: { 'x-trace': 'on', 'content-type': 'text/plain' } as UTSJSONObject
})
// if the global default contains x-global, the final header = { x-global: ..., x-trace: 'on', content-type: 'text/plain' }
```

::: tip Content-Type Is Set Automatically
When the request body is a `UTSJSONObject` and `content-type` is not explicitly set (case-insensitive key check), the library sets `application/json`; the Content-Type of `string` / `ArrayBuffer` request bodies is up to you. See [Transforming Requests & Responses](./transform) for details.
:::

> The native layer may lowercase header keys (the official hello uni-app x example includes a dedicated check). The library does no key-case normalization; when reading the response header, null-check as needed. See [Platform Compatibility](./compatibility) for details.

## getUri: Offline URL Building

`getUri(config)` builds the full URL using **exactly the same** normalization rules as a real request (baseURL joining + params encoding). It sends nothing and runs no interceptors — suitable for logging, analytics, and pre-check scenarios:

```uts
import { getUri } from '@/uni_modules/ux-request'

// slash tolerance: any combination of a trailing / in baseURL and a leading / in url joins correctly
getUri({ url: '/x', baseURL: 'https://api.test/v1/', params: { a: 'a b', n: 1, ok: true } as UTSJSONObject })
// https://api.test/v1/x?a=a%20b&n=1&ok=true

getUri({ url: 'y', baseURL: 'https://api.test/v1' })
// https://api.test/v1/y

// absolute urls are used as-is (baseURL is ignored); the query is still merged
getUri({ url: 'https://abs.test/z?a=1', baseURL: 'https://should-ignore.test', params: { b: 'b/c' } as UTSJSONObject })
// https://abs.test/z?a=1&b=b%2Fc
```

If normalization fails (e.g. empty url), the original url is returned as a fallback; passing `null` as config returns an empty string. For the full signature see the API doc [getUri()](../api/get-uri).
