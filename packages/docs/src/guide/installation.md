# 安装

## 环境要求

- **uni-app x** 工程（`.uvue` 页面 + UTS）
- **HBuilderX 4.41+**：五端中 `uni.request` 的最低可用版本为微信小程序 4.41，本库以其为基线（各端可用版本见[平台兼容性](./compatibility)）
- 仓库验证环境为 **HBuilderX 5.26**，建议使用较新版本
- Vue 3：uni-app x 已内置 Vue 3，**无需额外安装**；npm 包中的 `vue` 仅以可选 peer 依赖声明（`>=3.0.0`）

## 获取方式

unix-request 为标准 **uni_modules UTS 插件**（插件 ID：`ux-request`），支持 npm 与 uni_modules 两种获取方式，二选一即可。

### 方式一：npm 安装

```bash
npm install @meng-xi/unix-request
# 或
pnpm add @meng-xi/unix-request
```

包内直接是 `.uts` 源码（`main` / `exports` 均指向 `utssdk/index.uts`），由 uni-app x 编译链在构建时按目标平台现场编译，无需预编译。引入时使用包名：

```uts
import { request } from '@meng-xi/unix-request'
```

### 方式二：uni_modules 方式

将仓库 `packages/core` 目录下的内容（`utssdk/`、`package.json` 等）拷贝到工程的 **`uni_modules/ux-request`** 目录，即完成安装。引入时使用 uni_modules 路径（**本指南与 playground 全部示例均采用此形态**）：

```uts
import { request } from '@/uni_modules/ux-request'
```

::: warning 两种方式不要混用
同一工程**二选一**：既 npm 安装又在 `uni_modules/` 下拷贝一份，会导致同一插件的重复符号。从 npm 方式切换到 uni_modules 方式（或反向）时，请先完整移除旧的一份。
:::

## UTS 源分发

| 平台 | 编译产物 |
| --- | --- |
| Web / 小程序 | JavaScript |
| Android | Kotlin |
| iOS | Swift |

请求编排逻辑在各原生端直接编译为 Kotlin / Swift 代码执行，没有运行时 JS 桥接开销；底层网络能力完全复用官方 `uni.request` 原生实现，各端行为与官方 API 同源。

## 验证安装

以下代码不做真实网络请求，仅验证插件可正常导入与 URL 构建：

```uts
import { getUri } from '@/uni_modules/ux-request'

console.log(getUri({
	url: '/api/user/1',
	baseURL: 'https://api.example.com',
	params: { id: 1, q: 'a b' } as UTSJSONObject
}))
// https://api.example.com/api/user/1?id=1&q=a%20b
```

再发起一个真实请求（官方测试服务器，可直接运行）：

```uts
import { get } from '@/uni_modules/ux-request'
import type { RequestError } from '@/uni_modules/ux-request'

get<any>('https://request.dcloud.net.cn/api/http/method/get', null)
	.then((res) => {
		console.log('statusCode=' + res.statusCode.toString())
	})
	.catch((err) => {
		const e = err as RequestError
		console.log('code=' + e.code + ' errMsg=' + e.errMsg)
	})
```

看到 `statusCode=200` 即安装成功。常见首跑问题：相对路径请求报 `ERR_CONFIG`（未配置 baseURL，见[快速开始](./getting-started)）；`ERR_PARAM`（url 为空）。

> 完整可运行示例见仓库根目录下的 `packages/playground`（用 HBuilderX 打开即可运行）。
