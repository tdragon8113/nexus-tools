# Nexus Tools

一款专为开发者打造的工具箱，集开发工具和个人效率管理于一体，采用现代化的云端原生架构。

## 功能特性

### 本地工具集
- JSON 工具套件（格式化/压缩/验证）
- 文本处理工具（Excel/CSV 与 JSON 互转，Markdown 编辑预览）
- 编码/解码工具（Base64 文本/图片解码，Hash 生成器，JWT 令牌解析）

### 效率管理
- 待办事项管理
- 时间追踪（活动记录与统计报告）

### 云端同步
- 离线优先设计
- 实时冲突解决
- 版本历史回溯

### 体验优化
- CMD+K 快速启动
- 自定义快捷键
- 跟随系统主题

## 技术架构

| 层级 | 技术 |
|------|------|
| Mac 应用 | SwiftUI + GRDB.swift |
| API 网关 | Spring Cloud Gateway |
| 用户服务 | Spring Boot 3.x |
| 工作空间服务 | Spring Boot 3.x |
| 数据库 | MySQL |
| 缓存 | Redis |
| 服务注册 | Nacos |
| 消息队列 | RabbitMQ |

## 开发进度

- [x] Phase 1: 架构基础
- [ ] Phase 2: 本地工具集
- [ ] Phase 3: 用户系统
- [ ] Phase 4: 待办+时间管理
- [ ] Phase 5: 主题+快捷键

## License

MIT License