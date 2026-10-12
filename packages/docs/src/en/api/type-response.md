# ResponseResult

The unified response structure resolved on success by `request<T>` / the shortcut methods, mirroring the axios response schema. The alias `ResponseAny = ResponseResult<any>` is used where `data` flows as `any`, such as instance methods and interceptors.

```uts
export type ResponseResult<T> = {
	data: T
	statusCode: number
	header: any
	cookies: Array<string>
	/** The final merged configuration that issued this request (mirrors axios response.config) */
	config: RequestConfig | null
}

/** Non-generic response alias (instance methods / interceptors and other places where data flows as any) */
export type ResponseAny = ResponseResult<any>
```

## Fields

| Name | Type | Description |
| --- | --- | --- |
| `data` | `T` (generic) | Response data. Already JSON-parsed by the native layer when `dataType` is `json`; an empty response body (HEAD / 204) is normalized to an empty object, keeping the contract non-null |
| `statusCode` | `number` | HTTP status code. By default only 2xx resolves (`validateStatus`); 4xx / 5xx reject |
| `header` | `any` | Response header (returned as-is in the native structure; the library does not normalize key casing) |
| `cookies` | `Array<string>` | Response cookies |
| `config` | `RequestConfig \| null` | The **final merged configuration** that issued this request (the send snapshot after the three-level merge), useful for logging and debugging |

::: tip Why there is no statusText
The native `uni.request` success callback does not provide statusText, and the `request` reference inside the response is not exposed — the response structure only keeps fields that actually exist natively, without inventing empty placeholders.
:::

## Generics

- `T` is only a consumer-side static annotation (the generic argument of `request<T>` lands on `data`); the response data actually flows as `any`, with no runtime instantiation involved;
- **Instance methods and interceptors provide no generics**: every `RequestInstance` method returns `ResponseAny`; cast as needed on the business side:

```uts
api.get('/users/1', null).then((res) => {
	const user = res.data as UTSJSONObject
})
```

- The input and return values of an interceptor's `onFulfilled` are both `ResponseAny`; see [Interceptor API](./interceptors).

## Examples

```uts
import { request } from '@/uni_modules/ux-request'

request<{ id: number, name: string }>({ url: '/api/users/1' }).then((res) => {
	console.log(res.statusCode)      // 200
	console.log(res.data.name)       // statically annotated via the generic
	console.log(res.cookies.length)
	console.log(res.config.url)      // the full URL actually sent
})
```

## Related APIs

- [request()](./request)
- [RequestConfig](./type-request-config) (the structure of the `config` field)
- [RequestError](./type-request-error) (`error.response` carries this structure)
- [Making Requests](../guide/requests)
