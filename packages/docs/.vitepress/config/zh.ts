import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/unix-request/'
export const META_TITLE = 'Unix Request'
export const META_DESCRIPTION = '为 uni-app x 提供功能完善的网络请求库'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** 网站配置 描述 */
	description: META_DESCRIPTION,

	/** 网站配置 头信息 */
	head: [
		['meta', { property: 'og:url', content: META_URL }],
		['meta', { property: 'og:description', content: META_DESCRIPTION }],
		['meta', { property: 'twitter:url', content: META_URL }],
		['meta', { property: 'twitter:title', content: META_TITLE }],
		['meta', { property: 'twitter:description', content: META_DESCRIPTION }]
	],

	/** 网站主题配置 */
	themeConfig: {
		/** 编辑链接 */
		editLink: {
			pattern: 'https://github.com/MengXi-Studio/unix-request/edit/master/packages/docs/:path',
			text: '对本页提出修改建议'
		},

		/** 大纲标题 */
		outlineTitle: '本页内容',

		/** 导航栏 */
		nav: [
			{ text: '指南', link: '/guide/introduction' },
			{ text: 'API', link: '/api/request' },
			{ text: '更新日志', link: '/changelog' },
			{
				text: '相关链接',
				items: [
					{ text: 'Discussions', link: 'https://github.com/MengXi-Studio/unix-request/discussions' },
					{ text: 'Releases', link: 'https://github.com/MengXi-Studio/unix-request/releases' }
				]
			}
		],

		sidebar: {
			'/guide/': [
				{
					text: '入门',
					items: [
						{ text: '介绍', link: '/guide/introduction' },
						{ text: '安装', link: '/guide/installation' },
						{ text: '快速开始', link: '/guide/getting-started' }
					]
				},
				{
					text: '核心功能',
					items: [
						{ text: '发起请求', link: '/guide/requests' },
						{ text: '请求配置', link: '/guide/request-config' },
						{ text: '参数与请求头', link: '/guide/params-and-headers' },
						{ text: '响应结构', link: '/guide/response-schema' },
						{ text: '多实例与全局默认', link: '/guide/instances' }
					]
				},
				{
					text: '进阶',
					items: [
						{ text: '拦截器', link: '/guide/interceptors' },
						{ text: '请求与响应转换', link: '/guide/transform' },
						{ text: '取消请求', link: '/guide/cancel' },
						{ text: '错误处理', link: '/guide/error-handling' }
					]
				},
				{
					text: '精通',
					items: [
						{ text: '请求流程原理', link: '/guide/request-flow' },
						{ text: '平台兼容性', link: '/guide/compatibility' },
						{ text: '常见问题', link: '/guide/faq' }
					]
				}
			],
			'/api/': [
				{
					text: '核心 API',
					items: [
						{ text: 'request()', link: '/api/request' },
						{ text: '快捷方法', link: '/api/quick-methods' },
						{ text: 'createRequest()', link: '/api/create-request' },
						{ text: 'Request 实例', link: '/api/request-instance' },
						{ text: 'getUri()', link: '/api/get-uri' },
						{ text: 'configureRequest()', link: '/api/configure-request' },
						{ text: '拦截器 API', link: '/api/interceptors' },
						{ text: 'createCancelSource()', link: '/api/create-cancel-source' }
					]
				},
				{
					text: '类型',
					items: [
						{ text: 'RequestConfig', link: '/api/type-request-config' },
						{ text: 'RequestQuickConfig', link: '/api/type-request-quick-config' },
						{ text: 'RequestDefaults', link: '/api/type-request-defaults' },
						{ text: 'ResponseResult', link: '/api/type-response' },
						{ text: 'RequestError', link: '/api/type-request-error' },
						{ text: 'RequestErrorCode', link: '/api/type-request-error-code' },
						{ text: 'RequestInstance', link: '/api/type-request-instance' },
						{ text: 'CancelToken / CancelSource', link: '/api/type-cancel' }
					]
				}
			]
		}
	}
}
