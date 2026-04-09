# Changelog

All notable changes to this project will be documented in this file.

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