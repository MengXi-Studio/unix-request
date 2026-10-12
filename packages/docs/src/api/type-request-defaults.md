# RequestDefaults

全局 / 实例默认配置类型，是 [configureRequest()](./configure-request)、[createRequest()](./create-request) 与实例 `setConfig` 的统一入参。四个字段均需占位（可传 `null`）。

```uts
/** 全局 / 实例默认配置（configureRequest / createRequest / setConfig 入参；null 表示沿用内置默认） */
export type RequestDefaults = {
	/** 默认 baseURL */
	baseURL: string | null
	/** 默认超时（毫秒） */
	timeout: number | null
	/** 默认 header（与请求级浅合并） */
	header: UTSJSONObject | null
	/** 默认状态码校验 */
	validateStatus: ((statusCode: number) => boolean) | null
}
```

## 字段

| 名称 | 类型 | `null` 时的内置默认 | 说明 |
| --- | --- | --- | --- |
| `baseURL` | `string \| null` | 无 | 默认 baseURL；为 `null` 且请求用相对路径时 fail-fast `ERR_CONFIG` |
| `timeout` | `number \| null` | `60000` | 入口常量 `DEFAULT_TIMEOUT`；请求级 `timeout` 有值即覆盖 |
| `header` | `UTSJSONObject \| null` | 空 | 默认 header，与请求级 header 浅合并（请求级同名键覆盖） |
| `validateStatus` | `((statusCode: number) => boolean) \| null` | 2xx 校验 | 默认状态码校验（`statusCode >= 200 && statusCode < 300`）；请求级有值即整体覆盖 |

::: tip null 的语义
字段为 `null` 表示**沿用内置默认**（而非「清除该配置」）——归一化层逐项判空回退。因此「取消全局 header」应传空对象 `{}`，传 `null` 得到的同样是空 header，但语义上更推荐前者；「清除 baseURL」没有对应表达（内置默认即无 baseURL）。
:::

## 使用位置

| 入口 | 作用域 | 说明 |
| --- | --- | --- |
| [configureRequest(defaults)](./configure-request) | 默认实例 | 全局默认，通常在 `App.uvue` `onLaunch` 调用一次 |
| [createRequest(defaults)](./create-request) | 新建实例 | 创建时注入，实例间相互隔离 |
| `instance.setConfig(defaults)` | 已有实例 | 运行时更新实例默认（如切换环境），见 [Request 实例](./request-instance) |

::: warning 不含 method 字段
`RequestDefaults` 只有上表四项——默认 method 固定为 `'GET'`（入口常量 `DEFAULT_METHOD`），不可按实例定制；需要其他 method 时在请求级显式传 `method` 或用[快捷方法](./quick-methods)。
:::

## 示例

```uts
import { configureRequest, createRequest } from '@/uni_modules/ux-request'

// 全局默认
const globalHeader: UTSJSONObject = {}
globalHeader['x-client'] = 'uni-app-x'
configureRequest({
	baseURL: 'https://api.example.com',
	timeout: 15000,
	header: globalHeader,
	validateStatus: null // 沿用内置 2xx 校验
})

// 实例默认（与全局默认互不影响）
const oss = createRequest({ baseURL: 'https://oss.example.com', timeout: 5000, header: null, validateStatus: null })
```

## 相关 API

- [configureRequest()](./configure-request)
- [createRequest()](./create-request)
- [Request 实例](./request-instance)（`setConfig`）
- [多实例与全局默认](../guide/instances)
