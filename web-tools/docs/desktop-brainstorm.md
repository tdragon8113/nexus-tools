# Nexus 桌面端方案（v2）

## 需求

1. **快捷键** → 搜索框  
2. **剪贴板** → 自动匹配工具  
3. **工具集** → 独立全量列表页  
4. **工具页** → 仅工具本身，无网站式目录/侧栏  

## 实现

- **单 Electron 窗口** + 窗内 SPA（`?desktop=1`）
- 路由：`/desktop/search` | `/desktop/hub` | `/tools/{id}`
- 平台代码：`app/core` + `app/shells` + `layouts/desktop.vue`
- 各工具业务 UI 仍在 `app/pages/tools/*.vue`（本地计算逻辑未重写）

## 开发

```bash
cd web-tools && npm run dev
cd desktop && npm run build && NEXUS_WEB_DEV=1 npm run dev
```
