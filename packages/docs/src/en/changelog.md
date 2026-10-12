# Changelog

## [0.1.0] - 2026-10-12

### Added

- First usable release: default instance + multiple instances (`createRequest`), request/response interceptors (multiple ordered registrations, eject, recover/rethrow/pass-through on errors), unified `RequestError` structure, and core capabilities including baseURL / header merge / params encoding / transform / validateStatus / timeout / cancellation (`createCancelSource`)
- Seven shortcut methods: get / post / put / patch / del / head / options, with the method injected by the function name
- `getUri()` builds the full URL offline (including params encoding); the `onTask` escape hatch exposes the native RequestTask
- Platforms covered: Web / WeChat Mini Program / Android (iOS and HarmonyOS pending verification)
