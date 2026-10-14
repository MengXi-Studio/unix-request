# 参数与请求头

本篇说明 `params` 的确定性编码规则、GET/HEAD 请求体并入 query 的契约、`header` 的浅合并规则，以及 `getUri` 离线构建 URL。

## params：查询参数

`params` 是官方 `uni.request` 没有的字段。官方对「GET data → query」的隐式转换未明文编码规则（编码方式 / 嵌套对象处理 / 各端一致性均无承诺），因此本库提供 `params` 并由**库内确定性编码**，不依赖原生隐式行为：

```uts
import { get } from '@/uni_modules/mx-request'

get<any>('/api/http/method/get', {
	params: { page: 1, keyword: 'meng xi', active: true } as UTSJSONObject
})
// 实际请求：GET /api/http/method/get?page=1&keyword=meng%20xi&active=true
```

编码规则（键、值均经 `encodeURIComponent`）：

| 值类型 | 编码结果 | 示例 |
| --- | --- | --- |
| `string` | 原样转义 | `'a b'` → `a%20b` |
| `number` | 转字符串 | `1` → `1` |
| `boolean` | `true` / `false` | `true` → `true` |
| `UTSJSONObject` / 数组等其余类型 | `JSON.stringify` 后转义 | `{"x":1}` → `%7B%22x%22%3A1%7D` |
| `null` | 跳过该键 | — |

## 与 url 既有 query 合并

url 中已带的 query 会与 `params` 合并，用 `&` 续接；url 尾部的孤立 `?` / `&` 做容错处理：

```uts
import { getUri } from '@/uni_modules/mx-request'

getUri({
	url: '/api/list?size=10',
	baseURL: 'https://api.example.com',
	params: { page: 2 } as UTSJSONObject
})
// https://api.example.com/api/list?size=10&page=2
```

## GET/HEAD 的 data 自动并入 query

对 GET / HEAD 请求，`data` 为 `UTSJSONObject` 时自动编码并入 query（**排在 params 之后**），随后归一化产物中 `data` 恒为 `null`：

```uts
get<any>('/api/http/method/get', {
	params: { a: 'a b' } as UTSJSONObject,
	data: { 'from-data': 'get-body' } as UTSJSONObject
}).then((res) => {
	// res.config.url === '.../api/http/method/get?a=a%20b&from-data=get-body'
})
```

::: tip 为什么这么设计
GET 携带请求体是 uni-app 的惯例行为（hello uni-app x 官方示例含「检测query」专项测试佐证），但官方未明文编码规则与各端一致性。库内把这一隐式行为变成**显式契约**：query 由本库统一编码，data 不再透传原生，五端行为完全一致。
:::

- 非 `UTSJSONObject` 形态的 GET/HEAD `data` 不会并入 query，也不会透传原生；
- 这也是自定义 `transformRequest` 时必须判空的原因，见[请求与响应转换](./transform)。

## header：浅合并

`header` 按键浅合并：实例默认 header（`configureRequest` / 实例 defaults）先铺底，请求级同名键覆盖、其余键保留；合并写入全新对象，不会改动业务传入的对象：

```uts
import { get } from '@/uni_modules/mx-request'

get<any>('/api/http/method/get', {
	header: { 'x-trace': 'on', 'content-type': 'text/plain' } as UTSJSONObject
})
// 若全局默认含 x-global，最终 header = { x-global: ..., x-trace: 'on', content-type: 'text/plain' }
```

::: tip 自动补设 Content-Type
请求体为 `UTSJSONObject` 且未显式设置 `content-type`（键大小写不敏感检查）时，库内补设 `application/json`；`string` / `ArrayBuffer` 请求体的 Content-Type 由业务自管。详见[请求与响应转换](./transform)。
:::

> 原生可能对 header 键做小写化（hello uni-app x 官方示例含专项检测），库内不做键大小写规范化，读取响应 header 时请按需判空，详见[平台兼容性](./compatibility)。

## getUri：离线构建 URL

`getUri(config)` 按与真实请求**完全相同**的归一化规则构建完整 URL（baseURL 拼接 + params 编码），不发网络、不跑拦截器，适合日志、埋点、预检场景：

```uts
import { getUri } from '@/uni_modules/mx-request'

// 斜杠容错：baseURL 尾部与 url 头部的 / 任意组合都能正确拼接
getUri({ url: '/x', baseURL: 'https://api.test/v1/', params: { a: 'a b', n: 1, ok: true } as UTSJSONObject })
// https://api.test/v1/x?a=a%20b&n=1&ok=true

getUri({ url: 'y', baseURL: 'https://api.test/v1' })
// https://api.test/v1/y

// 绝对地址原样使用（baseURL 被忽略），query 仍会合并
getUri({ url: 'https://abs.test/z?a=1', baseURL: 'https://should-ignore.test', params: { b: 'b/c' } as UTSJSONObject })
// https://abs.test/z?a=1&b=b%2Fc
```

归一化失败（如 url 为空）时返回原始 url 兜底；config 传 `null` 返回空字符串。完整签名见 API 文档 [getUri()](../api/get-uri)。
