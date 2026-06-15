# Changelog

All notable changes to this project will be documented in this file.

## [0.2.20] - 2026-06-15

### 修复（web-tools 桌面端）

- **搜索面板**：打开时默认聚焦名称搜索框，剪贴板自动填入 Query 后不再抢焦点

## [0.2.19] - 2026-06-12

### 新增（web-tools 桌面端）

- **IP 查询**、**经纬度反查**工具；搜索可识别 IP 与坐标并预览
- 桌面端经主进程代理查询，避免渲染进程网络限制

### 改进（web-tools 桌面端）

- **JSON**：精简工具栏（压缩复制、全部展开/折叠）；取消键名排序时恢复原键顺序；缩进引导线
- 搜索最近使用与收藏列表行为优化

### 修复（web-tools 桌面端）

- **macOS 启动器**：默认仅在菜单栏驻留，热键首次按下可正常唤出窗口（不再误隐藏）

## [0.2.18] - 2026-06-05

### 变更（web-tools 桌面端）

- **工具精简**：仅保留 2FA/TOTP、JSON 格式化、Base64、计算器；移除时间戳、二维码、颜色、正则、文本编辑、文本对比、HTTP、UUID、密码、哈希、URL、代码格式化、JS 运行等工具
- **搜索**：内容识别与预览同步收窄至上述四类；移除文本编辑兜底
- **依赖**：清理 diff、Prettier、markdown-it、spark-md5 及多余 CodeMirror 语言包

## [0.2.17] - 2026-06-05

### 修复（web-tools 桌面端）

- **macOS 检查更新后安装按钮闪退**：已下载同一版本时重复检查不再清空状态；签名校验失败不再覆盖「已下载」为「无法检查」
- **未签名 macOS 更新提示**：已下载时显示「请手动安装」，主按钮改为「打开下载页」（仍不支持应用内静默安装）

## [0.2.16] - 2026-06-05

### 改进（web-tools 桌面端）

- **持久化架构**：桌面端用户数据以 `~/Library/Application Support/Nexus Tools/` 为唯一来源；renderer 通过 IPC 读写内存（`useState`），不再依赖 `localStorage` 双写
- **覆盖范围**：最近使用、收藏、工具排序、JS Playground、计算器记录、文本编辑/对比偏好、TOTP 账户、主题偏好均走主进程 JSON 文件
- **迁移**：启动时一次性将旧 `localStorage` 数据迁入 userData 并清除 legacy 键
- **静态服务**：恢复随机端口（`listen(0)`），数据不再绑定页面 origin

## [0.2.15] - 2026-06-05

### 修复（web-tools 桌面端）

- **重启后最近使用/收藏丢失**：桌面端 renderer 数据（最近使用、收藏、工具排序、主题偏好）统一写入 `~/Library/Application Support/Nexus Tools/renderer-local-state.json`；启动时从主进程同步到 `localStorage`，写入时双写磁盘
- **localStorage 跨重启失效**：打包版静态服务改用固定端口，避免每次启动 origin 变化导致浏览器存储隔离

## [0.2.14] - 2026-06-05

### 修复（web-tools 桌面端）

- **Mac 应用图标导致崩溃**：移除 `app.getFileIcon()`（在 macOS 上经 ThreadPoolForegroundWorker 加载 NSImage 时易 SIGTRAP）；改为仅通过 `sips` 读取 `.icns`，串行加载并缓存失败路径，限制预取数量与并发

## [0.2.13] - 2026-06-05

### 修复（web-tools 桌面端）

- **设置页检查更新报错**：修复发现新版本后下载时未先调用 `checkForUpdates()`，导致提示 `Please check update first` /「无法检查」的问题
- 更新相关错误提示改为中文（如 GitHub 连接失败）

## [0.2.12] - 2026-06-05

### 修复（web-tools 桌面端）

- **2FA 快捷键无效**：修复账户仅存在于界面 `localStorage`、未同步到主进程时，快捷键触发后静默失败的问题；启动与打开 2FA 页时自动合并并同步账户
- **工具行点击无响应**：修复开启排序后收藏/工具行点击被拖拽逻辑误拦截的问题
- **Mac 应用图标**：优先读取 `.app` 内 `.icns`，限制并发加载，避免批量请求导致 Electron 崩溃
- **搜索窗位置**：在鼠标所在显示器唤起；同屏拖动后 1 小时内记住位置，超时再居中

### 改进（web-tools 桌面端）

- 搜索收藏列表不再展示星标（收藏仍可通过右键菜单管理）
- 2FA 快捷键：账户未同步时给出明确提示；绑定失效时系统通知说明原因
- 从工具返回搜索且剪贴板未变时，不再重复填入 Query

## [0.2.11] - 2026-06-04

### 新增（web-tools 桌面端）

- **搜索收藏**：右键结果可加入/取消收藏；空闲时展示「最近使用 → 收藏 → 建议」
- **2FA 搜索预览**：选中 2FA 工具时右侧列出已配置账户与实时验证码；点击复制（经主进程剪贴板，兼容沙箱）
- **统一顶栏**：搜索窗与工具集共用 `DesktopShellHeader`，切换时布局不再跳动；搜索页恢复设置入口

### 改进（web-tools 桌面端）

- 搜索布局：名称/Query 清空按钮；左侧列表收窄、预览区加宽；移除底部 Actions 栏，「工具集」入口移至左上角
- 用 `2fa` 等关键词找工具时不再误筛账户；修复预览区底部占位大块空白
- 启动：预热搜索壳层；非「登录项」启动时直接显示搜索窗；搜索↔工具集切换尽量保持窗高
- 搜索/工具集字号与工具页筛选框样式统一；桌面复制走 `writeClipboardText` IPC
- 设置「检查更新」在开发模式给出明确提示

## [0.2.10] - 2026-06-04

### 改进（web-tools 桌面端）

- **2FA 快捷键设置**：点击区域开始录制；需点「完成」才保存；录制期间暂停全局快捷键，避免与组合键冲突

## [0.2.9] - 2026-06-04

### 新增（web-tools 桌面端）

- **Raycast 风格搜索**：名称匹配工具/应用；Query 区按内容格式匹配工具并预览
- **Mac 应用搜索**：启动器内搜索并打开本机应用（图标逐步完善）
- **2FA 全局快捷键**：为账号设置快捷键，在任意应用自动填入 TOTP
- **外观主题**：设置页可选亮色 / 暗色 / 跟随系统，工具集与各工具页暗色适配
- **JSON 格式化**：折叠占位显示 `··· N 项` / `··· N 个字段`，不再仅显示 `[...]`

### 改进（web-tools 桌面端）

- 搜索回车默认打开工具并带入 Query 内容（JSON 等自动预填/格式化）；复制预览移至操作菜单
- 工具集、设置页、编辑器与开关等统一暗色令牌；设置项说明图标与主题一致
- 搜索/Query 占位文案与职责拆分，避免与内容匹配混淆

## [0.2.8] - 2026-05-29

### 新增（web-tools 桌面端）

- **JS 运行**：临时编写并执行 JavaScript，支持 `console` 输出、`return` 与 top-level `await`（5s 超时）
- **JS 运行**：统一补全（全局 API 签名、链式属性、代码片段、局部变量）
- **文本编辑**：Markdown 语法下支持编辑 / 分屏 / 预览三种视图
- macOS 菜单栏托盘图标：左键唤起搜索，右键快捷开关与设置入口
- 设置页「开机自动启动」

### 改进（web-tools 桌面端）

- **文本对比**：编辑模式与对比模式分离；对比视图为只读对齐 diff，需点击「开始对比」
- 文本对比 / JS 运行编辑器选区与顶部留白体验优化
- 托盘菜单精简：剪贴板策略仅在设置页配置

## [0.2.7] - 2026-05-29

### 修复（web-tools 文本对比）

- 对比 Windows（CRLF）与 Unix（LF）换行时不再整篇误报为差异
- 在 delete/insert 对齐占位行输入与另一侧相同内容时，不再误报差异（右侧字符数显示为 0 的问题）

## [0.2.6] - 2026-05-29

### 修复（web-tools 文本对比）

- 统一 CRLF/CR 为 LF 后再分行对比，避免整篇标红

## [0.2.5] - 2026-05-29

### 新增（web-tools 桌面端）

- 设置页「软件更新」：检查更新、自动下载；Windows 下载完成后可自动安装并重启
- macOS 启动时自动清除下载隔离标记（`com.apple.quarantine`），DMG 覆盖安装后一般无需再手动 `xattr -cr`

### 改进（web-tools 桌面端）

- 设置页「版本 / 自动检查更新」分行展示，与其它设置项布局一致
- CI Release 附带 `latest.yml` / `latest-mac.yml` 与 zip，供应用内更新使用

## [0.2.4] - 2026-05-28

### 新增（web-tools 桌面端）

- **文本对比**：对比选项（忽略行尾空白 / 空白 / 大小写 / 空行）、复制 Unified Diff、大文本防抖与字符级高亮降级
- **文本对比**：按当前语法格式化（JSON / JS / TS / HTML / CSS / Markdown），左右栏独立复制与格式化图标
- 桌面设置页组件化（`DesktopSettings*`），失焦自动隐藏可在设置中关闭

### 改进（web-tools 桌面端）

- 文本对比并排对齐 diff、差异块跳转、滚动同步与 CodeMirror 行内高亮
- 启动器失焦行为：图钉置顶；自动隐藏开则收起；关则沉到其它窗口下方
- 应用图标体积优化

## [0.2.3] - 2026-05-26

### 新增（web-tools 桌面端）

- CI 发布 Windows x64 安装包 `NexusTools-setup.exe`（与 macOS DMG 同一 `web-tools-v*` tag）
- 本地打包命令：`npm run desktop:dist:win` / `desktop:dist:mac`

## [0.2.2] - 2026-05-25

### 新增（web-tools 桌面端）

- 剪贴板策略：智能 / 始终 / 从不自动填入，设置页可配置
- 搜索页剪贴板提示条（Tab 填入、Esc 忽略）
- 桌面设置页（标题栏齿轮入口）

### 改进（web-tools 桌面端）

- Base64 工具页内滚动，长内容与图片预览可完整查看
- 搜索打开工具时按目标工具预填，工具集切换不再串入其他工具内容
- 搜索/工具窗体高度与布局稳定性（避免面板被压扁或留白）
- 剪贴板与搜索输入经 IPC 传递，避免 composable 在 setup 外调用报错

### 修复（web-tools 桌面端）

- 修复搜索匹配 Base64 打开后未自动填入的问题
- 修复从 Base64 切到其他工具时误带入剪贴板/搜索缓存的问题

## [0.2.1] - 2026-05-22

### 修复（web-tools 桌面端）

- macOS 通用包构建时启用 ad-hoc 签名（`mac.identity: "-"`），修复 Apple Silicon 上「Nexus Tools.app 已损坏」误报
- Homebrew cask 安装后自动 `xattr -cr` 清除隔离属性

## [0.2.0] - 2026-05-21

### 新增（web-tools 桌面端）

- Electron 桌面壳：Option+Space 唤起搜索、工具集与工具页（800×600 单窗）
- 剪贴板匹配经 IPC，避免长内容撑爆 URL
- 工具集列表 / 图标两种视图（本地记忆）
- 文本对比工具、工作台侧栏与多标签

### 改进（web-tools）

- JSON 工具：CodeMirror 实时校验（波浪线 + 悬停说明）、桌面单栏布局、格式化失败 Toast
- 发布流水线：仅 `web-tools-v*` tag 构建 DMG 并更新 Homebrew cask

### 安装

```bash
brew tap tdragon8113/tap
brew install --cask nexus-tools
```

## [v1.0.12] - 2026-04-21

### 修复（部署）

- GitHub Actions `deploy.yml`：网关健康检查改为 **`/actuator/health/liveness`**（避免聚合健康在 Redis/Nacos 未就绪时返回 503 导致 `curl -sf` 失败）；并增加 `curl --retry` 等待容器就绪

## [v1.0.11] - 2026-04-21

### 修复（网关 / 部署）

- `nexus-gateway` 增加 **Spring Boot Actuator**，暴露 `/actuator/health`，与 `deploy.yml` 中 `curl http://localhost:8080/actuator/health` 健康检查一致，避免部署在网关检查步骤失败

## [v1.0.10] - 2026-04-20

### 新增（Web）

- JSON 工具：CodeMirror 输入/输出编辑区、代码折叠与行号、文本 / 树 / 表格 / 类型 / 对比视图
- JSON 本地历史（IndexedDB，约 50 条）
- 顶栏工具搜索与从首页「打开工具」预填 JSON 等能力
- 管理端基础页面（如时间工具入口）

### 改进（Web）

- JSON：Tab 与 Shift-Tab 按「缩进」选项（1～4 空格或 Tab）缩进
- JSON：同一对象内重复键名校验（`JSON.parse` 静默覆盖的问题会明确报错）
- JSON：解析错误波浪线悬停显示完整说明（`@codemirror/lint` 诊断提示）
- 首页、站点工具目录、认证与个人中心相关布局与样式

### 修复（Web）

- CodeMirror 6：`indentWithTab` 需包在 `keymap.of([...])` 中，避免初始化报错

## [v1.0.3] - 2026-04-10

### 新增

- 仓库根目录 `.env.example`，本地用环境变量联调 Nacos / Redis / MySQL / RabbitMQ（与 `application.yml` 占位符一致）

### 改进

- Nacos `spring.config.import` 按 **`nexus-*-${spring.profiles.active}.yml`** 拉取对应环境配置（默认 `prod`）
- `docker-compose.yml` / `docker-compose.prod.yml` 仅注入 **Nacos 与 `SPRING_PROFILES_ACTIVE`**，与「中间件配置在 Nacos」的生产方式对齐；统一使用 `NACOS_SERVER_ADDR`
- `nexus-workspace-service` RabbitMQ 默认用户名与 **user-service** 一致（`rabbitmq`）
- `CLAUDE.md` 补充本地 `.env` 与生产 Nacos 的分工说明；`docker/.env.example` 补充注释

## [v1.0.2] - 2026-04-09

### 新增

- 用户个人中心功能
  - 注册：用户名、邮箱、密码
  - 登录：会话管理、本地持久化
  - 个人信息展示
  - 退出登录
  - 注销账号（带确认弹窗）
- Mac 应用认证 UI（LoginView、RegisterView、AuthView、ProfileView）
- 后端注销账号 API（DELETE /auth/account）

### 改进

- Environment 重命名为 AppEnvironment，避免与 SwiftUI 冲突
- NetworkService 添加 getSessionCookie 方法

## [v1.0.1] - 2026-04-09

### 新增

- Mac 应用发布自动化（DMG 构建 + GitHub Releases + Homebrew Tap）
- self-hosted runner 配置，支持本地构建 Mac 应用

### 改进

- CLAUDE.md 简化，保留核心信息
- 部署配置优化，仅需配置 Nacos 环境变量

### 修复

- release workflow update-tap job 缺少 checkout step

## [v1.0.0] - 2026-04-08

### 新增

- Mac 应用：SwiftUI + GRDB.swift，支持 macOS 14.0+
- 后端微服务：Spring Boot 3.x + Gateway + MyBatis
- 中间件集成：MySQL, Redis, Nacos, RabbitMQ
- GitHub Actions 自动部署到 Aliyun
- Nacos 配置中心管理所有服务配置