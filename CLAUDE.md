# Nexus Tools

开发者工具箱项目。

## 技术栈

| 模块 | 技术 |
|------|------|
| Mac 应用 | SwiftUI + GRDB.swift (macOS 14.0+) |
| 后端 | Spring Boot 3.x + Gateway + MyBatis (Java 21) |
| 中间件 | MySQL, Redis, Nacos, RabbitMQ |

## 项目结构

```
nexus-tools/
├── mac-app/                    # Mac 应用
├── backend/                    # 后端微服务
│   ├── nexus-gateway/          # 网关 (:8080)
│   ├── nexus-user-service/     # 用户服务 (:8081)
│   └── nexus-workspace-service/ # 工作区服务 (:8082)
└── docker/                     # Docker 配置
```

## 本地开发

### 后端

```bash
source ~/.sdkman/bin/sdkman-init.sh && sdk use java 21.0.10-tem
cd backend && mvn clean install -DskipTests

java -jar nexus-gateway/target/*.jar --spring.profiles.active=local
java -jar nexus-user-service/target/*.jar --spring.profiles.active=local
java -jar nexus-workspace-service/target/*.jar --spring.profiles.active=local
```

### Mac 应用

打开 `mac-app/NexusTools.xcodeproj`，Build & Run。

## 生产部署

### 后端服务

推送 tag 触发 GitHub Actions 自动构建：

```bash
git tag v1.0.0 && git push origin v1.0.0
```

服务器仅需配置 Nacos 环境变量，MySQL/Redis/RabbitMQ 配置在 Nacos 配置中心管理。

### Mac 应用

同样通过推送 tag 发布（与后端共用同一 tag）：

- 构建 DMG 并上传到 GitHub Releases
- 自动更新 Homebrew Tap (`brew install tdragon8113/tap/nexus-tools`)

需要配置 GitHub Secrets：`TAP_TOKEN`（有 homebrew-tap 写权限的 PAT）

## 注意事项

- 数据库连接等敏感配置通过 Nacos 读取，禁止硬编码
- 测试覆盖率要求 80%+
- 禁止跳过测试提交