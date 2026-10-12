import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://mengxi-studio.github.io/unix-request/en/'
export const META_TITLE = 'Unix Request'
export const META_DESCRIPTION = 'A full-featured HTTP request library for uni-app x'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	/** 网站配置 描述 */
	description: META_DESCRIPTION,

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
			text: 'Suggest changes to this page'
		},

		/** 大纲标题 */
		outlineTitle: 'Contents of this page',

		/** 导航栏 */
		nav: [
			{ text: 'Guide', link: '/en/guide/introduction' },
			{ text: 'API', link: '/en/api/request' },
			{ text: 'Changelog', link: '/en/changelog' },
			{
				text: 'Links',
				items: [
					{ text: 'Discussions', link: 'https://github.com/MengXi-Studio/unix-request/discussions' },
					{ text: 'Releases', link: 'https://github.com/MengXi-Studio/unix-request/releases' }
				]
			}
		],

		sidebar: {
			'/en/guide/': [
				{
					text: 'Getting Started',
					items: [
						{ text: 'Introduction', link: '/en/guide/introduction' },
						{ text: 'Installation', link: '/en/guide/installation' },
						{ text: 'Quick Start', link: '/en/guide/getting-started' }
					]
				},
				{
					text: 'Core Features',
					items: [
						{ text: 'Making Requests', link: '/en/guide/requests' },
						{ text: 'Request Config', link: '/en/guide/request-config' },
						{ text: 'Params & Headers', link: '/en/guide/params-and-headers' },
						{ text: 'Response Schema', link: '/en/guide/response-schema' },
						{ text: 'Instances & Global Defaults', link: '/en/guide/instances' }
					]
				},
				{
					text: 'Advanced',
					items: [
						{ text: 'Interceptors', link: '/en/guide/interceptors' },
						{ text: 'Transforming Requests & Responses', link: '/en/guide/transform' },
						{ text: 'Cancellation', link: '/en/guide/cancel' },
						{ text: 'Error Handling', link: '/en/guide/error-handling' }
					]
				},
				{
					text: 'Mastery',
					items: [
						{ text: 'Request Flow', link: '/en/guide/request-flow' },
						{ text: 'Platform Compatibility', link: '/en/guide/compatibility' },
						{ text: 'FAQ', link: '/en/guide/faq' }
					]
				}
			],
			'/en/api/': [
				{
					text: 'Core API',
					items: [
						{ text: 'request()', link: '/en/api/request' },
						{ text: 'Shortcut Methods', link: '/en/api/quick-methods' },
						{ text: 'createRequest()', link: '/en/api/create-request' },
						{ text: 'Request Instance', link: '/en/api/request-instance' },
						{ text: 'getUri()', link: '/en/api/get-uri' },
						{ text: 'configureRequest()', link: '/en/api/configure-request' },
						{ text: 'Interceptor API', link: '/en/api/interceptors' },
						{ text: 'createCancelSource()', link: '/en/api/create-cancel-source' }
					]
				},
				{
					text: 'Types',
					items: [
						{ text: 'RequestConfig', link: '/en/api/type-request-config' },
						{ text: 'RequestQuickConfig', link: '/en/api/type-request-quick-config' },
						{ text: 'RequestDefaults', link: '/en/api/type-request-defaults' },
						{ text: 'ResponseResult', link: '/en/api/type-response' },
						{ text: 'RequestError', link: '/en/api/type-request-error' },
						{ text: 'RequestErrorCode', link: '/en/api/type-request-error-code' },
						{ text: 'RequestInstance', link: '/en/api/type-request-instance' },
						{ text: 'CancelToken / CancelSource', link: '/en/api/type-cancel' }
					]
				}
			]
		}
	}
}
