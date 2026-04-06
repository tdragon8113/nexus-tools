# Nexus Tools

一款专为开发者打造的工具箱，集开发工具和个人效率管理于一体。

## 项目结构

```
nexus-tools/
├── mac-app/          # Mac 应用（SwiftUI）
├── backend/          # 后端微服务
│   ├── nexus-gateway/
│   ├── nexus-user-service/
│   ├── nexus-workspace-service/
│   └── nexus-common/
├── docker/           # Docker 配置
└── docs/             # 文档
```

## 技术栈

- Mac 应用: SwiftUI + GRDB.swift (macOS Sonoma 14.0+)
- 后端: Spring Boot 3.x + Spring Cloud Gateway + MyBatis (Java 21)
- 中间件: MySQL, Redis, Nacos, RabbitMQ

## 开发指南

### 后端启动

1. 确保中间件已启动
2. 创建数据库：
   ```sql
   CREATE DATABASE nexus_user;
   CREATE DATABASE nexus_workspace;
   ```
3. 运行 SQL 初始化脚本（见 docs/sql/）
4. 启动服务：
   ```bash
   cd backend
   mvn clean install
   java -jar nexus-gateway/target/nexus-gateway-*.jar
   java -jar nexus-user-service/target/nexus-user-service-*.jar
   java -jar nexus-workspace-service/target/nexus-workspace-service-*.jar
   ```

### Mac 应用启动

1. 打开 `mac-app/NexusTools.xcodeproj`
2. Build & Run

### Docker 部署

```bash
cd docker
cp .env.example .env
# 编辑 .env 配置中间件地址
docker-compose up --build
```

## API 基础路径

- Gateway: http://localhost:8080/api/v1
- User Service: http://localhost:8081 (内部)
- Workspace Service: http://localhost:8082 (内部)

## 测试要求

- 单元测试覆盖率: 80%+
- 使用 JUnit 5 + Mockito (后端)
- 使用 XCTest (Mac)