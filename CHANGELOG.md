# Changelog

All notable changes to this project will be documented in this file.

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