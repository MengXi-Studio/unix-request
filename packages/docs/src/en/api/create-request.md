# createRequest()

`createRequest(defaults: RequestDefaults | null): RequestInstance` creates an independent request instance (mirroring `axios.create`). The instance has its own [RequestDefaults](./type-request-defaults) and interceptor registry, fully isolated from the default instance.

```uts
import { createRequest } from '@/uni_modules/ux-request'

const api = createRequest({
	baseURL: 'https://api.example.com',
	timeout: 10000,
	header: null,
	validateStatus: null
})

api.get<UTSJSONObject>('/users/1', null).then((res) => {
	console.log(res.data)
})
```

## Why Multiple Instances

The default instance (top-level APIs such as [request()](./request)) is a module-level singleton; the defaults modified by `configureRequest` and the interceptors registered by `useRequestInterceptor` all live on it. The following scenarios need mutually isolated instances:

- **Multiple backends**: the business API and third-party APIs each have their own baseURL, timeout, and auth header;
- **Interceptors that don't pollute each other**: a token header injected on instance A should not appear on instance B's requests (registries are isolated per instance, see the example below);
- **Local environment reproduction**: e.g. reproducing the `ERR_CONFIG` error ("relative path without baseURL") on an isolated instance, unaffected by the global baseURL.

## Parameters

`createRequest(defaults: RequestDefaults | null)`

| Parameter | Type | Description |
| --- | --- | --- |
| `defaults` | [RequestDefaults](./type-request-defaults) \| `null` | Instance default configuration. `null` means all built-in defaults apply (no baseURL / timeout `60000` / empty header / 2xx validateStatus) |

## Return Value

Returns a [RequestInstance](./type-request-instance) — an instance object structurally identical to the default instance; see [Request Instance](./request-instance) for the member list. Instance methods provide no generics; `data` is returned as `any` (`ResponseAny`), cast as needed on the business side.

::: tip Isolated interceptor registries
Each instance maintains its own request/response interceptor registries: an interceptor registered via `useRequestInterceptor` on instance A only applies to A's requests, and `ejectInterceptor` only looks up A's registry. For the default instance's interceptors see [Interceptor API](./interceptors).
:::

## Examples

### Two backends, isolated

```uts
import { createRequest } from '@/uni_modules/ux-request'

// Business API: long timeout + auth header
const authHeader: UTSJSONObject = {}
authHeader['Authorization'] = 'Bearer <token>'

const api = createRequest({
	baseURL: 'https://api.example.com',
	timeout: 15000,
	header: authHeader,
	validateStatus: null
})

// Object storage: short timeout, no auth
const oss = createRequest({ baseURL: 'https://oss.example.com', timeout: 5000, header: null, validateStatus: null })

api.get<UTSJSONObject>('/me', null)
oss.get<UTSJSONObject>('/bucket/a.png', null)
```

### Instance-level interceptor isolation

```uts
import { createRequest } from '@/uni_modules/ux-request'

const a = createRequest({ baseURL: 'https://a.test', timeout: 10000, header: null, validateStatus: null })
const b = createRequest({ baseURL: 'https://b.test', timeout: 10000, header: null, validateStatus: null })

// Only applies to a
const rid = a.useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['x-only-a'] = 'A'
	}
	return config
})

a.request({ url: '/x' }).then((resA) => {
	b.request({ url: '/x' }).then((resB) => {
		// resA.config carries x-only-a, resB.config does not
		a.ejectInterceptor(rid)
	})
})
```

## Related APIs

- [Request Instance](./request-instance)
- [RequestInstance](./type-request-instance)
- [RequestDefaults](./type-request-defaults)
- [configureRequest()](./configure-request)
- [Multiple Instances and Global Defaults](../guide/instances)
