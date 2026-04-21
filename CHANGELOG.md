# Changelog

All notable changes to this project will be documented in this file.

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