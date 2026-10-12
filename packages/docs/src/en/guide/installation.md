# Installation

## Requirements

- A **uni-app x** project (`.uvue` pages + UTS)
- **HBuilderX 4.41+**: the lowest version where `uni.request` is available among the five platforms is WeChat Mini Program 4.41, which this library takes as its baseline (per-platform availability see [Platform Compatibility](./compatibility))
- The repository was verified on **HBuilderX 5.26**; a newer version is recommended
- Vue 3: uni-app x already ships Vue 3 built in, **no extra installation needed**; the `vue` in the npm package is declared only as an optional peer dependency (`>=3.0.0`)

## How to Get It

unix-request is a standard **uni_modules UTS plugin** (plugin ID: `ux-request`). It supports two ways to obtain it — npm and uni_modules; pick either one.

### Option 1: npm

```bash
npm install @meng-xi/unix-request
# or
pnpm add @meng-xi/unix-request
```

The package contains `.uts` source code directly (`main` / `exports` both point to `utssdk/index.uts`); the uni-app x toolchain compiles it on-site per target platform at build time, no precompilation needed. Import it by package name:

```uts
import { request } from '@meng-xi/unix-request'
```

### Option 2: uni_modules

Copy the contents of the repository's `packages/core` directory (`utssdk/`, `package.json`, etc.) into your project's **`uni_modules/ux-request`** directory and installation is complete. Import via the uni_modules path (**all examples in this guide and the playground use this form**):

```uts
import { request } from '@/uni_modules/ux-request'
```

::: warning Do not mix the two options
**Pick exactly one** per project: installing via npm while also copying a copy under `uni_modules/` produces duplicate symbols of the same plugin. When switching from npm to uni_modules (or the reverse), remove the old copy completely first.
:::

## UTS Source Distribution

| Platform | Compiled output |
| --- | --- |
| Web / Mini Program | JavaScript |
| Android | Kotlin |
| iOS | Swift |

Request orchestration logic compiles directly to Kotlin / Swift code on native platforms, with no runtime JS bridging overhead; the underlying network capability fully reuses the official native `uni.request` implementation, so behavior on each platform comes from the same source as the official API.

## Verify the Installation

The following code makes no real network request; it only verifies that the plugin imports correctly and builds URLs:

```uts
import { getUri } from '@/uni_modules/ux-request'

console.log(getUri({
	url: '/api/user/1',
	baseURL: 'https://api.example.com',
	params: { id: 1, q: 'a b' } as UTSJSONObject
}))
// https://api.example.com/api/user/1?id=1&q=a%20b
```

Then make a real request (official test server, runs as-is):

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

Seeing `statusCode=200` means the installation succeeded. Common first-run issues: a relative-path request reports `ERR_CONFIG` (no baseURL configured, see [Quick Start](./getting-started)); `ERR_PARAM` (empty url).

> For complete runnable examples see `packages/playground` at the repository root (open it with HBuilderX and run).
