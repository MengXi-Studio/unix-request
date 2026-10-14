# Instances & Global Defaults

unix-request provides two kinds of instances: the **default instance** (a module-level singleton; the top-level API is it) and **independent instances created by `createRequest`** (mirroring `axios.create`). Their defaults and interceptor registries are mutually isolated.

## The Default Instance: Works Out of the Box

`request` / `get` / `post` etc. imported directly from the package entry are all bound to the default instance. Global defaults can be set in one go with `configureRequest`:

```uts
import { configureRequest } from '@/uni_modules/mx-request'

const header: UTSJSONObject = {}
header['x-global'] = 'global-default'

configureRequest({
	baseURL: 'https://request.dcloud.net.cn',
	timeout: 15000,
	header: header,
	validateStatus: null
})
```

- The most common usage is in `onLaunch` of `App.uvue`, so every relative-path request across the app shares the baseURL and default header;
- All 4 fields of `RequestDefaults` (`baseURL` / `timeout` / `header` / `validateStatus`) may be `null`; `null` means falling back to the built-in defaults (GET / 60000 ms / no header / 2xx);
- `configureRequest` **replaces wholesale** the default instance's defaults with the new object — even if you only want to change baseURL, write out the other fields too (fill `null` for unchanged fields to fall back to the built-in defaults).

For the full signature see the API doc [configureRequest()](../api/configure-request).

## createRequest: Multiple Instances

```uts
import { createRequest } from '@/uni_modules/mx-request'

const instA = createRequest({ baseURL: 'https://a.example.com', timeout: 10000, header: null, validateStatus: null })
const instB = createRequest({ baseURL: 'https://b.example.com', timeout: 20000, header: null, validateStatus: null })

instA.getUri({ url: '/x' }) // https://a.example.com/x
instB.getUri({ url: '/x' }) // https://b.example.com/x
```

Typical scenarios: an app that talks to both a business service and a file service, multiple environment gateways, an SDK that needs its own request stack, etc.

::: tip What Is Isolated
Two things are isolated between instances: **defaults** (baseURL / timeout / header / validateStatus) and the **interceptor registry** — an interceptor registered on instA does not affect instB, nor the default instance, and vice versa.
:::

Passing `null` as `defaults` means all built-in defaults apply. For the full signature see the API doc [createRequest()](../api/create-request).

## Instance Methods at a Glance

The instance object has the same shape as the default instance (identical members):

| Member | Description |
| --- | --- |
| `request(config)` | The main entry. UTS has no call signatures, so instances cannot be invoked directly like functions; always go through this method |
| `get` / `post` / `put` / `patch` / `del` / `head` / `options` | Shortcut methods; the method is fixed by the method name |
| `getUri(config)` | Build the full URL offline (including params encoding) |
| `setConfig(defaults)` | Modify this instance's defaults (equivalent to `configureRequest` on the default instance) |
| `useRequestInterceptor` / `useResponseInterceptor` / `ejectInterceptor` | Register and remove interceptors (affect only this instance) |

```uts
instA.setConfig({ baseURL: 'https://c.example.com', timeout: null, header: null, validateStatus: null })
```

::: warning Instance Methods Return ResponseAny
The top-level API offers generics (e.g. `get<T>` returns `ResponseResult<T>`); **instance methods return data as `any`** (`ResponseAny`), and the business side asserts as needed. This is a constraint of UTS generics across the proxy shape — see [Response Schema](./response-schema) for details.
:::

For the full member signatures see the API docs [Request Instance](../api/request-instance) and the [RequestInstance type](../api/type-request-instance).

## Multi-Instance Isolation, Verified

The following uses the same verification structure as the playground — defaults isolation is shown intuitively with `getUri`, and interceptor isolation is verified with a header marker:

```uts
const netA = createRequest({ baseURL: HOST, timeout: 10000, header: null, validateStatus: null })
const netB = createRequest({ baseURL: HOST, timeout: 10000, header: null, validateStatus: null })

const rid = netA.useRequestInterceptor((config) => {
	const h = config.header
	if (h != null) {
		h['x-only-a'] = 'A'
	}
	return config
})

netA.request({ url: '/api/http/method/get' }).then((resA) => {
	netB.request({ url: '/api/http/method/get' }).then((resB) => {
		// resA.config.header contains x-only-a: 'A'; resB.config.header does not
		netA.ejectInterceptor(rid)
	})
})
```

## Next Steps

- Registering interceptors, the three error paths, and practical recipes → [Interceptors](./interceptors)
- How defaults merge with request-level config → [Request Config](./request-config)
