# Nexus Tools

一款专为开发者打造的工具箱，集开发工具和个人效率管理于一体，采用云端原生架构。

## 功能特性

### 开发工具
- **JSON 工具** - 格式化、压缩、验证
- **文本处理** - Excel/CSV 与 JSON 互转，Markdown 编辑器
- **编解码工具** - Base64、Hash 生成器、JWT 解析
- **URL 工具** - URL 编解码、正则测试

### 效率管理
- **待办事项** - 任务追踪，支持优先级和截止日期
- **时间追踪** - 活动记录与统计报告

### 云端同步
- 离线优先设计
- 实时冲突解决
- 版本历史回溯

### 用户体验
- CMD+K 快速启动
- 自定义快捷键
- 跟随系统主题

## 技术栈

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

## 项目结构

```
nexus-tools/
├── mac-app/              # SwiftUI Mac 应用
├── backend/
│   ├── nexus-gateway/    # API 网关
│   ├── nexus-user-service/
│   ├── nexus-workspace-service/
│   └── nexus-common/
├── docs/
│   └── sql/              # 数据库脚本
└── docker/               # Docker 配置
```

## 快速开始

### 环境要求
- Java 21
- Xcode 15+ (Mac 应用)
- MySQL 8.0+
- Redis
- Nacos 2.x

### 后端启动

```bash
cd backend

# 编译
mvn clean package -DskipTests

# 启动服务
java -jar nexus-gateway/target/nexus-gateway-*.jar --spring.profiles.active=local &
java -jar nexus-user-service/target/nexus-user-service-*.jar --spring.profiles.active=local &
java -jar nexus-workspace-service/target/nexus-workspace-service-*.jar --spring.profiles.active=local &
```

### Mac 应用启动

```bash
cd mac-app
open NexusTools.xcodeproj
# 在 Xcode 中 Build & Run
```

## API 端点

| 服务 | 端口 | 路径 |
|------|------|------|
| Gateway | 8080 | `/api/v1/*` |
| User Service | 8081 | 内部调用 |
| Workspace Service | 8082 | 内部调用 |

## 开发路线

- [x] Phase 1: 架构基础
- [ ] Phase 2: 本地开发工具
- [ ] Phase 3: 用户认证系统
- [ ] Phase 4: 待办与时间追踪
- [ ] Phase 5: 主题与快捷键

## License

[MIT License](LICENSE)