# getUri()

`getUri(config: RequestConfig | null): string` builds the full URL offline from the given configuration — **no network call, no interceptors** (mounted on the default instance and using its defaults; for the instance version see `getUri` in [Request Instance](./request-instance)).

```uts
import { getUri, configureRequest } from '@/uni_modules/ux-request'

configureRequest({ baseURL: 'https://api.example.com', timeout: 60000, header: null, validateStatus: null })

getUri({ url: '/users', params: { 'page': 1 } })
// → https://api.example.com/users?page=1
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `config` | [RequestConfig](./type-request-config) \| `null` | Request configuration. `null` returns an empty string |

## Return Value

`string` — the normalized full URL. Value rules:

- Normalization succeeds: returns the fully joined url (baseURL joining + query encoding both done);
- Normalization fails (`ERR_PARAM` / `ERR_CONFIG`, e.g. relative path without baseURL): returns the original `config.url` as a fallback, without throwing;
- `config` is `null`: returns `''`.

## Encoding Rules

`getUri()` uses the same normalization logic as real requests (strictly identical results to [request()](./request)):

- **params**: both keys and values are escaped with `encodeURIComponent` and joined as `key=value&…`; keys with `null` values are skipped; `string` as-is, `number` / `boolean` converted to string, everything else (UTSJSONObject / arrays / typed instances) via `JSON.stringify`;
- **data on GET / HEAD**: when `data` is a UTSJSONObject it is automatically merged into the query (after params) and no longer sent as the request body;
- **Existing query merging**: when the url already contains `?`, it continues with `&`; trailing `?` / `&` are tolerated;
- **baseURL joining**: URLs starting with `http(s)` are used as-is; relative paths are joined with baseURL (double slashes tolerated on either side).

::: tip For debugging
`getUri()` is handy for log instrumentation, link verification, and "what does the request actually look like" debugging, and is also commonly used to test whether an instance's defaults took effect.
:::

## Examples

```uts
import { getUri } from '@/uni_modules/ux-request'

// params encoding (space → %20)
getUri({ url: '/search', params: { 'q': 'uni app', 'page': 2 } })
// → /search?q=uni%20app&page=2

// GET data merged into query (after params)
getUri({ url: '/list', params: { 'a': 1 }, data: { 'b': 2 } })
// → /list?a=1&b=2

// Existing query continued with &
getUri({ url: '/list?from=push', params: { 'a': 1 } })
// → /list?from=push&a=1

// Relative path without baseURL: returned as-is, no throw
getUri({ url: '/relative' })
// → /relative
```

## Related APIs

- [request()](./request)
- [RequestConfig](./type-request-config)
- [Request Instance](./request-instance) (instance version of `getUri`)
- [Params and Headers](../guide/params-and-headers)
