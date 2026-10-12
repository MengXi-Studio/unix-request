# 经验教训记录（Strict：仅记录经运行验证的坑）

## 2026-10-10 M2 spike（HBuilderX 5.26 / Windows / playground __UNI__1927897）

### UTS 插件内部相对 import 三规则（全部实测，Android uts 链 "index not found" 根因）

1. **目录 import 要求目录内有 index.uts**：`from '../types'` 解析到 `types/index.uts`，目录内只有具名文件（如 `types/request.uts`）必失败。与 unix-utils 桶文件惯例一致。
2. **import 路径禁止显式 .uts 扩展名（目录中转场景）**：`from '../types/request.uts'`（文件实际存在）仍报
   `index not found`——rust 分析器把带扩展名的路径再按目录解析。省略扩展名（`from '../constants/defaults'`）或目录（含 index.uts）均可。
3. **index.uts（目录入口）内部不写跨级相对路径**：桶文件里 `export type { ... } from '../../interface.uts'` 触发 `index not found`（同目录文件 `./xxx` 正常）。unix-utils 同款结构（types/index.uts 只引
   `./toast`，向上引用放具名文件 toast.uts）。**稳妥策略：跨级（../interface.uts / ../types）引用全部写在具名文件里，桶只做同目录聚合**。

### HBuilderX CLI 工具链

4. **CLI 编译全流程需要有效 appid**：`publish`（h5 / mp-weixin / appResource）与 `launch` 均校验，占位 appid（如
   `__UNI__8F3C21`）或空值都报「appid 不存在，请在 manifest.json 中重新获取」。appid 只能由已登录 HBuilderX（`cli user info` 确认）在 GUI manifest 可视化页「重新获取」，CLI 无获取命令。
5. **`launch web --compile true` = 编译模式**：编译成功即退出（无常驻服务），日志判据「项目 playground 编译成功。」；不带 --compile 的 `launch web` 起常驻 vite dev server，但其对 `.uts` 按需转译未接管（`/main.uts`
   原样返回源码，浏览器白屏）——**Web 端运行验证不能用 dev server 白屏判断**，uts2js 全链路的硬证据是 `publish --platform mp-weixin` 完整产物。
6. **微信产物 API 按页面引用图导出**：`dist/build/mp-weixin/uni_modules/<id>/utssdk/index.js`
   的 exports 只含页面实际 import 的 API（未引用的 request/put/patch/del/head/options/configureRequest 不出现）——是 uts-proxy 按需导出的正常形态，不是丢 API。
7. **CLI open 必须先行**：`cli open` 启动 HBuilderX 后 `cli project open --path <绝对路径>` 导入项目（重复导入同一项目会在列表出现多条，无碍）。
8. **PowerShell 调 cli.exe 输出**：`& 'D:\HBuilderX\cli.exe' ... 2>&1 | Out-String`；`curl` 是 Invoke-WebRequest 别名须用 `curl.exe`；powershell profile 加载报错不影响命令执行。
9. **uts-proxy 类型名重整自洽（\__1）**：插件 Kotlin 产物中对外类型名被重整（RequestConfig__1 / RequestError__1 / ResponseAny__1，避让框架同名符号），但 uts-proxy 代理层按原名索引对应，编译通过即自洽无害（与 LESSONS
   20「同名 typealias 重整自洽」同类）。

### 泛型导出（Q10 spike 结论）

10. **插件导出泛型全链路可行**：`export type Request = <T>(config: RequestConfig) => Promise<ResponseResult<T>>`（泛型函数类型别名）+ `export const request: Request = function <T>(...)`（泛型 const 入口）+
    `ResponseResult<T>`（泛型响应 type）在 UTS→Kotlin 转换层完整保留（`typealias Request = <T>(config: RequestConfig__1) -> UTSPromise<ResponseResult<T>>`）。遗留：该 Kotlin 泛型 typealias 语法未经 Kotlin 编译器验证（appResource 只产出 .kt；dex 需真机/云打包，M4 首项）。
11. **含函数字段的对象可跨代理返回**：RequestInstance 13 个函数字段（含双可选函数参数的 useResponseInterceptor）Kotlin class 生成正常，createRequest 多实例进 v1（Q2 落定）。

### pnpm / 环境

12. **pnpm store 在项目外（E:\.pnpm-store）**：沙箱模式禁止符号链接创建导致 install 失败（exit -4048），需非沙箱执行。

## 2026-10-11 M2 管线全量实现（三端编译回归，产物级验证）

### 对象联合类型的跨端运行时判别（onRejected 返回 ResponseAny | RequestError | null）

13. **联合类型编码差异大，instanceof / typeof 全不可用**：Kotlin 端对象联合编译为 `Any?`（真实类实例），web 端 type 别名擦除（但 RequestError 等 type 编译为真实 class 构造器）。**跨端统一判别策略：`as RequestError`
    强转探针 + errSubject 契约值比对**（库内错误 errSubject 恒为 'unix-request'，ResponseResult 无此字段）。
14. **UTS catch 编译为 Kotlin `catch (e: Throwable)`**（产物验证）——`ResponseResult as RequestError` 的 ClassCastException 可被捕获，强转探针在 Android 运行时安全；web 端 `as` 擦除后等价于字段探测（undefined
    ≠ 契约值）。**Swift 端 `as` 语义（as! 崩溃 vs as? 空安全）未验证，M4 iOS 首测项**。

### 跨文件类型引用与编译器差异

15. **Kotlin 同包 type 引用免 import 会静默通过，但 web/TS 检查器要求显式 import type**（报 warning 不报 error）——插件内跨文件类型引用必须全部显式 import，且验收要以 h5
    release 编译零 warning 为准（Kotlin 通过 ≠ 无问题）。

### HBuilderX CLI（5.26 补充）

16. **`launch web --compile true` 行为不稳定**（同一命令本次走了 dev server 模式且无产物输出）；Web 端硬产物验证改用 **`publish --platform h5`**（release 编译，TS 检查更严格，warning 也会暴露）。
17. **uni.request 泛型调用形态可用**：`uni.request<RequestSuccess<any>>({...} as RequestOptions<RequestSuccess<any>>)` 三端编译通过；自定义 RequestMethod 字面量联合可直接赋给
    `RequestOptions.method`（string）；`uni.request` 返回值可在同一同步块内登记 cancel 注册表（check→send→register 无异步间隙，无竞态）。

## 2026-10-11 M3 运行时验证（Web 真实网络 15/15 通过）

18. **快捷方法 method 必须由方法名固定注入，不得依赖 config.method 透传**：快捷 config 通常为 null → 构造的 RequestConfig.method 为 null → normalize 兜底 'GET' → post/put/patch
    **静默以 GET 发出**（编译期零告警，服务端 405 才暴露）。同型陷阱：依赖「调用方总会传某字段」的隐式契约都会在快捷路径上断裂。
19. **uni-app x web（VDOM 模式）页面加载后事件桥未就绪**：自动化 browser_click 立即点击会**静默失效**（无报错、handler 不执行）；等待数秒或对内部真实元素程序化 `.click()` 可触发。浏览器自动化验证 uni-app
    x 页面的固定套路：navigate → 等待 ≥10s → snapshot 定位 → click → 失败则 evaluate 程序化 click 兜底。
20. **release 编译 tree-shake 未被页面引用的插件导出**（h5 与 mp-weixin 一致）：del/put/patch/head/options 不在产物 exports 中，属按需引用正常形态（与 LESSONS
    6 同型），不代表库缺 API；库完整性以源码与按需产物引用图为准。
21. **GET/HEAD 的 transformRequest 收到 null**：normalize 先把 data 并入 query 并置 null，transform 在 normalize 之后执行——自定义 transformRequest 内对 data 取属性会 TypeError（本轮由 method
    bug 下游暴露：post 被降级为 GET 后 data 进 query → transform 收 null → ERR_NATIVE「transformRequest 执行异常」）。设计语义：transform 作用于发送快照，GET/HEAD 场景 data 恒为 null，transform 内需判空。
22. **入口 export type 同目录转发可行**：`export type { ... } from './interface.uts'`（与入口同目录，非跨级）编译通过，消费方 `import type { RequestConfig } from '@/uni_modules/ux-request'`
    正常解析——对外类型须经入口转发，仅 import 不导出会让消费方 TS 检查报「not exported」。
23. **RequestQuickConfig 与 RequestConfig 拆分**：快捷方法 config 不含 url（url 由方法参数提供），避免调用方为满足 RequestConfig.url 必填传占位值——uts-proxy 对必填字段生成非空强转（NPE 红线），不能用「url 改可选」解决，只能拆类型。

## 2026-10-11~12 M4 Android 云打包（Kotlin 编译器层 / dex 全链路验证通过）

### 泛型导出与 Kotlin 编译器约束

24. **UTS 泛型函数类型别名转译为非法 Kotlin**：`type X = <T>(...)` 转译为 `typealias X = <T>(...) -> ...`，而 Kotlin 泛型参数必须声明在 typealias 名上（`typealias X<T> = ...`），转译器不做此变换——**M2
    spike 通过的只是 UTS→Kotlin 转译层，Kotlin 编译器层才暴露**。appResource 产物级验证不能替代真实编译（compileReleaseKotlin）。
25. **泛型 API 最终形态：入口具名 `export function apiName<T>(...)`**：const 绑定的泛型函数字面量转译为 Kotlin 匿名 `fun <T>` 被 Kotlin 禁止（Type parameters are prohibited here，首轮云打包 8 处编译错误根因）；顶层具名
    `fun <T>` 合法。T 仅静态标注
    `ResponseResult<T>`（消费方 TS 视图），响应 data 实际以 Any 流转、无运行时实例化需求——该形态同时规避 uts-for-android 泛型传递丢失约束（蒸汽模式无此问题，VDOM 模式才有）。非泛型 API 不受影响，仍走官方 const 模式。
26. **`uni.request` 泛型调用的 as 断言丢泛型实参**：M2 验证可用的 `uni.request<T>({...} as RequestOptions<RequestSuccess<any>>)`
    在 Kotlin 转译后 as 断言丢失泛型实参——改为先声明显式类型变量（`let options: RequestOptions<RequestSuccess<any>> = {...}`）再传 `uni.request<T>(options)`；泛型实参是数据类型 T 而非 RequestSuccess\<T\>。
27. **Kotlin 函数类型参数逆变**：库内回调签名放宽为 `(data: any | null) => any` 后，页面侧自定义回调若仍写 `(data: any)` 即编译报错——回调签名变更必须库内 / 页面全链路同步。
28. **`RequestSuccess<any>.data` 在 Kotlin 绑定层为 `Any?`**：与库内 ResponseResult.data 非空 any 契约冲突（第二轮云打包仅剩 2 错的根因）——响应入口用 UTS 官方 `??`
    空值合并操作符归一（`const rawData: any = res.data ?? emptyData`），契约保持非空。
29. **回调闭包引用外层 RequestTask 转译为 val 初始化器自引用**：success/fail 闭包直接引用外层 `let task` 编译错误——taskHolder 中转：`let taskHolder: RequestTask | null = null` 先声明，回调内判空后
    `taskHolder as RequestTask` 使用，发送后回填。
30. **`toMap().forEach((value, key) => {})` 双参回调 Kotlin 签名不匹配**：UTSJSONObject 遍历统一用 `keys()` 取键数组 + 索引 for 循环（跨端签名一致）；iOS 端 keys() 兼容性官方标注为 x，留 iOS 首测验证。

### 云打包运维（HBuilderX 5.26 / Windows）

31. **pack 必须 `--ignoreWarnings true`**：不传会因 x86 CPU 架构提示 + 首次打包计费确认交互中断命令行流程（CI 场景无人工确认通道）。
32. **云打包 CLI 日志中继可能断连**：本地日志 0 字节 / 进程零 CPU 零网络 ≠ 云端任务失败，用官方 `cli pack status --project <路径>`
    查真实状态；`cli logcat pack`（5.11+）可拉云端打包日志、`cli pack cancel`（5.14+）可取消。晚高峰排队约 65 分钟（队列 #214 实测），打包阶段本身约 1 分钟。

## 2026-10-12 playground 多页重构（ux-router 接入，三端编译 + Web 冒烟）

33. **publish 系列命令必须 `--project playground`**（HBuilderX 5.26 实证报「参数 project 值不能为空」，与 LESSONS 7 的 project open 同为前置）；`project list` 存在多条重名 playground 时，先对目标绝对路径执行
    `project open` 再 publish，编译日志会回显 appid（__UNI__1927897）可确认指向正确。
34. **后台 Shell 任务起服务时 cwd 可能不生效**：`npx serve -l 8123 .`（cwd=dist/build/web）实际落在项目根，返回 dev 模板 index.html（引用 /main.uts 与 /@vite/client），页面白屏且控制台零报错——硬证据是 serve 日志出现
    `GET /main.uts`（release 构建不可能请求该路径）。对策：后台命令一律用绝对路径参数（`serve -l 8123 <abs-path>`），不依赖 cwd。
35. **history 路由模式深链接需 SPA fallback**：`npx serve` 默认对 /pages/xxx/xxx 返回 404（静态服务器行为，非应用 bug，应用内 router.push 点击导航不受影响）；验证深链接须 `serve --single`。

## 2026-10-12 npm/vite 构建链（uni CLI 直跑，绕开 HBuilderX）

36. **UNI_INPUT_DIR 盘符大小写失配 → h5 产物静默变空壳（npm 链第一坑）**：uni:h5-main-js 等 uni 平台插件用 `id === normalizePath(resolve(UNI_INPUT_DIR, 'main')) + '.uts'` 严格相等匹配；PowerShell 会话传小写 `e:\...`
    而 vite 模块 id 规范化为大写 `E:/...` → filter 全部失配 → main.uts 不被注入 `createApp().app.use(__plugin).mount("#app")`
    引导、createApp 导出被 tree-shake、App/pages 整体消失，产物退化为 97KB 框架壳（含 router/index.uts 顶层副作用与路由表，因 createRouter 是唯一被 import 副作用保留的代码）。**全程 build exit
    0、控制台零报错、`Cannot find name` 仅是 tsconfig 类型检查 warning**——白屏无法从构建日志发现。对策：`UNI_INPUT_DIR`
    必须传 fs.realpathSync 规范化盘符（`E:\...`）；三端（h5/mp-weixin/app-android）同因一并受影响，须统一修复后重构建。诊断手法：NODE_OPTIONS --require 钩子劫持 `@dcloudio/uni-cli-shared/dist/vite/plugins/mainJs.js`
    的 defineUniMainJsPlugin，打印 transform id 与 filterMatch；健康产物判据 = bundle 含 `mount("#app")` + 每页独立 chunk + App.uvue 业务字符串（如 global-default）。
37. **uni-h5-vite / uni-h5-vue 是 uni-app x web 专用管线且早已在依赖图中**：uni-h5 的 `uni-app.main: dist/uni.compiler.js` 指向 re-export
    uni-h5-vite 的加载器，uni-h5 自身 dependencies 声明两者（HBuilderX 内嵌工具链也独立附带）；手工把二者装为 playground 直接依赖是无效操作（pnpm 本已解析），首轮排查被该假设带偏。空壳产物的判别捷径：`customElements.get('uni-view')=true 而 uni-page/uni-text=false`
    的注册不对称性 + bundle 内搜 `createSSRApp`/`mount("#app")`/`onLaunch` 全缺失 = 引导插件未生效，而非运行时崩溃。

## 2026-10-12 多页形态 Android 云打包第一轮（前向引用 / 联合返回转 Unit / 非空 header）

38. **script setup 顶层函数转译为「fun gen_x_fn + val x = ::gen_x_fn」局部对，val 声明前引用即 Kotlin
    Unresolved**：页面内「先调用后定义」的函数（编排函数调子用例、then/catch 回调调尾部复位函数）在 Kotlin 层是前向引用局部 val，compileReleaseKotlin 报 Unresolved reference（npm 链 build -p
    app-android 只产 .kt 不编译 Kotlin，暴露不了）。对策：**被调函数定义必须移到调用者之前**（源码声明顺序即依赖顺序），已写入两处页面注释。
39. **对象联合返回类型出现在函数类型返回位置，HBuilderX 转译器对回调字面量生成 Unit 期望**：onRejected 签名 `((err: RequestError) => ResponseAny | RequestError | null) | null`
    在云打包 Kotlin 侧回调按 Unit 期望处理（return 值即 Return type mismatch）；npm 链同位置却正确生成 Any?（产物 typealias 亦 Any?）——两链转译器行为差异。对策（LESSONS 27 transform 同款）：签名改
    `any | null`（插件 interface/index/instance/interceptors/types/error 五文件全链路同步），且**页面回调必须显式标注 `(err: RequestError): any | null => {...}`**——不标注时转译器自动推导会丢 null 标成非空 Any（return
    null 再报 Null cannot be non-null），显式标注后产物为 `fun(err: RequestError): Any?`。
40. **ResponseResult.header 字段为非空 any（Kotlin Any）**：页面侧手工构造 ResponseAny 兜底对象时 header 不可传 null，须给空 UTSJSONObject（先声明 `const emptyHeader: UTSJSONObject = {}` 再引用，直接内联 `{}`
    字面量在属性位置推断不稳）。

## 2026-10-12 H5 dev（运行到浏览器）MIME 报错

41. **uni-app x 项目根 index.html 入口必须写无扩展名 `src="/main"`，写 `src="/main.uts"` 时 dev 模式报 MIME type "" 且源码直出**：vite 5.2 官方 `isJSRequest` 的 knownJsSrcRE 不含 `.uts`/`.uvue` 扩展名 → 带 .uts 的 script
    src 请求不进 transformMiddleware，被当静态文件吐源码 + Content-Type 空 → 浏览器 module MIME 校验失败（`Failed to load module script ... MIME type of ""`）。uni:h5 的 transformIndexHtml 只把旧模板
    `src="/main.js"`/`/main.ts` 改写为 `/main`，不认 `/main.uts` 形态且无警告。**build 模式不受影响**（不走 dev server），故三端构建全过、仅 dev 暴露。判别链：`curl /main` 得 CT='' + 276 字节源码原文 = 入口形态错；修复后
    `/main` 返回 `text/javascript` 编译产物（import 带自动补的 `?import` 后缀闭环）。连带实证：vapor:true 在 web dev 下引发 `Invalid property descriptor` /
    `Invalid vnode type`（对照实验，移除即消失，build 不受影响）；pnpm 需 .npmrc `shamefully-hoist=true`（DCloud CLI 官方要求）。

## 2026-10-12 H5 控制台 SyntaxError: Unexpected end of JSON input（uni.request 空响应体）

42. **空响应体或非 JSON 文本 body 请求 + 默认 json dataType 时，web 控制台必现 `SyntaxError`（堆栈 xhr.onload → parseResponseText → uni-shared Object.parse），属良性噪音、请求仍正常 resolve**：uni-app x
    web 运行时（`uniapp-cli-vite/node_modules/@dcloudio/uni-h5/dist-x/uni-h5.es.js`，堆栈行号只对 dist-x 对齐，dist/dist-x-vapor 均不符）xhr.onload 对 text 响应调 `parseResponseText` → `UTS.JSON.parse`
    抛错；uni-shared 的 UTSJSON shim 内部 `catch (error) { console.error(error); return null }`——用户看到的报错就是这条被捕获后打印的噪音（DevTools 里经 installHook.js overrideMethod 转发亦可佐证）。随后
    `res = UTS.JSON.parse(res) || res` 回退原始文本，请求正常 resolve。两种触发形态均实测：① 空响应体 `Unexpected end of JSON input`（HEAD 按协议无 body，curl 实测 /api/http/method/head body=0、options
    body=53，报错次数与空 body 请求数吻合，release 实测七种 method 全部 statusCode=200）；② 非 JSON 文本 `Unexpected token 'N', "Not Found" is not valid JSON`（404 纯文本响应体，interceptors
    t12 恢复/换错/放行三条 404 路径各报一条，response.data 回退为 "Not Found" 使 responseBody 断言正常）。另有 Chrome 对非 2xx XHR 的固定红字
    `GET ... 404 (Not Found)`（任何网页无法抑制，与 uni 无关）。库层面无需也无法消除（解析在 uni.request 运行时内部，改 dataType 会改变所有响应 data 类型，不值得）。dev 环境实测被 vapor web
    dev 限制挡死（页面 setup 即报错、交互失效），用 build + serve --single 链路验证。

## 2026-10-12 docs 包（VitePress）构建踩坑

43. **VitePress 把每篇 md 编译为 Vue 模板，正文/标题/frontmatter details 中裸露的泛型尖括号（如 `request<T>`、`<reason>`、`ResponseResult<T>`）会让 `[vite:vue]` 报 `Element is missing end tag` 直接构建失败**：`<T>` 等被当成
    未闭合 HTML 起始标签解析；反引号 code span 内则安全。报错行号有偏移（报 39 行实为 28 行内容），不能按行号精确定位，要按文件全文排查。对策：标题、frontmatter、prose 中的泛型一律加反引号；排查手段为先剥离 ``` 围栏与行内代码再正则匹配 `<[A-Za-z]`（node 临时脚本一次性扫全量 md，避免 build 一轮一报）。另：新增 workspace 包后 `pnpm install` 须 `--no-frozen-lockfile` 且 sandbox 对 E: 盘临时文件拒写需 dangerouslyDisableSandbox。
