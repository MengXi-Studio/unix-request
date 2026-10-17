import { defineConfig } from 'vite'
import uniDefault from '@dcloudio/vite-plugin-uni'
import { routeGen } from './uni_modules/ux-router/plugins/index.mjs'

// vite-plugin-uni 为 CJS 导出（__esModule + default），Node 22.23 + vite 5.2.8
// config bundle 互操作下 `import uni from ...` 拿到的命名空间不含可调用绑定，
// 须显式取 .default（unix-storage 实测，unix-request 同环境复现）
const uni = (uniDefault as unknown as { default?: typeof uniDefault }).default ?? uniDefault

export default defineConfig({
	plugins: [
		routeGen({
			verbose: true,
			pages: {
				pagesDir: 'pages',
				subPackages: [{ root: 'pages-sub', dir: 'pages-sub' }],
				entryPage: 'pages/index/index',
				dts: 'define-uni-page.d.ts'
			},
			router: {
				outputPath: 'router/routes.gen.uts',
				importFrom: '@/uni_modules/ux-router/utssdk/index.uts',
				dts: 'route-name.gen.d.ts'
			}
		}),

		uni()
	]
})
