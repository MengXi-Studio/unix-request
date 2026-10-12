/**
 * RouteNameMap 字面量类型增强（由 @meng-xi/unix-router/vite-plugin 生成）
 * 供 WEB 端 RouteName 类型推导；原生端 UTS 不支持 keyof 组合，仍为 string。
 */
import '@/uni_modules/ux-router/utssdk/index.uts'

declare module '@/uni_modules/ux-router/utssdk/index.uts' {
	interface RouteNameMap {
		/** unix-request */
		home: 'pages/index/index'
		/** 二进制响应 */
		arraybuffer: 'pages-sub/arraybuffer/arraybuffer'
		/** 请求体与请求头 */
		'body-header': 'pages-sub/body-header/body-header'
		/** 取消请求 */
		cancel: 'pages-sub/cancel/cancel'
		/** 参数与配置错误 */
		'error-basic': 'pages-sub/error-basic/error-basic'
		/** 多实例与全局配置 */
		instances: 'pages-sub/instances/instances'
		/** 拦截器 */
		interceptors: 'pages-sub/interceptors/interceptors'
		/** 请求方法 */
		methods: 'pages-sub/methods/methods'
		/** 状态码与网络错误 */
		'status-error': 'pages-sub/status-error/status-error'
		/** 数据转换 */
		transform: 'pages-sub/transform/transform'
		/** URL 与参数 */
		'url-params': 'pages-sub/url-params/url-params'
	}
}
