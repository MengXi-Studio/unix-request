# configureRequest()

`configureRequest(defaults: RequestDefaults): void` 配置**默认实例**的全局默认配置（baseURL / timeout / header / validateStatus），App 内通常只在启动时调用一次。

```uts
import { configureRequest } from '@/uni_modules/ux-request'

const header: UTSJSONObject = {}
header['x-app'] = 'demo'

configureRequest({
	baseURL: 'https://api.example.com',
	timeout: 15000,
	header: header,
	validateStatus: null
})
```

::: warning 只作用于默认实例
`configureRequest` 写入的是默认实例（[request()](./request) 等顶层 API）的 defaults。`createRequest()` 创建的实例不受影响——它们用 `instance.setConfig` 修改各自的 defaults，见 [Request 实例](./request-instance)。
:::

## 参数

`configureRequest(defaults: RequestDefaults)`

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `defaults` | [RequestDefaults](./type-request-defaults) | 全局默认配置，四个字段均为必填位置、可传 `null` |

**`null` 字段语义**：字段为 `null` 表示沿用内置默认——

| 字段 | `null` 时的内置默认 |
| --- | --- |
| `baseURL` | 无（相对路径请求将 fail-fast `ERR_CONFIG`） |
| `timeout` | `60000`（入口常量 `DEFAULT_TIMEOUT`） |
| `header` | 空（不附加任何默认 header） |
| `validateStatus` | 2xx 校验（`statusCode >= 200 && statusCode < 300`） |

::: tip 合并层级
实际生效顺序为三级合并：**内置默认 < `configureRequest` 默认 < 请求级 RequestConfig**。标量字段请求级有值即覆盖；`header` 浅合并（请求级同名键覆盖默认键）；`validateStatus` 整体覆盖不合并。详见 [RequestConfig](./type-request-config) 与 [请求配置](../guide/request-config)。
:::

## 返回值

`void`。修改即时生效于后续请求，不作用于已在途的请求。

## 示例

App.uvue `onLaunch` 配置全局 baseURL 与默认 header：

```uts
// App.uvue
import { configureRequest } from '@/uni_modules/ux-request'

export class App implements IApp {
	onLaunch(): void {
		const header: UTSJSONObject = {}
		header['x-client'] = 'uni-app-x'
		configureRequest({
			baseURL: 'https://api.example.com',
			timeout: 15000,
			header: header,
			validateStatus: null
		})
	}
}
```

此后默认实例上的相对路径请求都会走该 baseURL，并自动携带默认 header（请求级同名键可覆盖）：

```uts
import { get } from '@/uni_modules/ux-request'

get<UTSJSONObject>('/api/health', null).then((res) => {
	// res.config.header 同时含 x-client 与请求级 header
})
```

## 相关 API

- [RequestDefaults](./type-request-defaults)
- [createRequest()](./create-request)（实例级默认）
- [Request 实例](./request-instance)（`setConfig`）
- [多实例与全局默认](../guide/instances)
