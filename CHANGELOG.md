# Changelog

All notable changes to this project will be documented in this file.

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