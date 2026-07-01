# web-time PWA 设计（添加到主屏幕）

## 目标

支持「添加到主屏幕」，全屏打开（图标、启动页、主题色）。不做离线记时或 API 缓存。

## 方案

使用 `vite-plugin-pwa`：Web App Manifest + 最小 Service Worker（仅 precache 静态资源）。

## Manifest

| 字段 | 值 |
|------|-----|
| name / short_name | 时光记 |
| start_url | `/manage/time/` |
| scope | `/manage/time/` |
| display | standalone |
| theme_color | `#0f3e17` |
| background_color | `#eef6ef` |
| lang | zh-CN |

## 图标

- 源文件：`public/icon.svg`（深绿 + 时钟，与 `--forest` 一致）
- 生成：`pwa-192.png`、`pwa-512.png`、`apple-touch-icon.png`（180）

## iOS

`index.html` 补充 `theme-color`、`apple-mobile-web-app-*`、`apple-touch-icon`。

## Service Worker

- `registerType: autoUpdate`
- Workbox 仅 precache 构建产物
- 不缓存 `/api/*`

## 验收

- Android Chrome：可安装，standalone 全屏
- iOS Safari：添加到主屏幕，图标与名称正确
- 主屏幕启动后路由与登录正常
