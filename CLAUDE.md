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

中间件地址与密码通过 **环境变量** 注入（与 `backend/*/src/main/resources/application.yml` 中 `${...}` 一致），**不需要** `application-local.yml` 或 `spring.profiles.active=local`，除非你自己加了 `@Profile("local")` 的代码。

Nacos 配置：`spring.config.import` 使用 Data ID **`nexus-<服务名>-${spring.profiles.active}.yml`**（占位符未解析时默认 `prod`）。请在 Nacos 中创建与当前 profile 对应的文件，例如 `nexus-gateway-prod.yml`、`nexus-user-service-local.yml`；或通过环境变量 `SPRING_PROFILES_ACTIVE` 切换环境。

1. 复制环境变量模板：`cp .env.example .env`，编辑 `.env` 填入真实值（`.env` 勿提交）。RabbitMQ 的 `RABBITMQ_*` 两服务共用同一套环境变量（与 `application.yml` 中占位符一致）。
2. **命令行 / AI 跑 Maven 前**在仓库根目录加载：  
   `set -a && source .env && set +a`  
   再 `cd backend` 执行 `mvn` 或 `java -jar`（子进程会继承上述变量）。
3. **IntelliJ**：Run Configuration → **Environment variables**，填入与 `.env.example` 相同的变量名；或用 EnvFile 等插件指向本地 `.env`。

```bash
source ~/.sdkman/bin/sdkman-init.sh && sdk use java 21.0.10-tem
cp .env.example .env   # 首次；之后只改 .env
set -a && source .env && set +a
cd backend && mvn clean install -DskipTests

java -jar nexus-gateway/target/*.jar
java -jar nexus-user-service/target/*.jar
java -jar nexus-workspace-service/target/*.jar
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

**本地 vs 生产（配置放哪）**

- **生产 / Docker / ACK**：保持 **只注入 Nacos 连接信息**（及 `SPRING_PROFILES_ACTIVE` 等）；MySQL、Redis、MQ 等仍写在 Nacos 对应 Data ID（如 `nexus-*-prod.yml`）里，**不必**在编排里再重复一套中间件环境变量（除非你要用环境变量显式覆盖 Nacos）。
- **本机直接跑 jar / Maven / IDEA**：用仓库根目录 **`.env`** 提供 `MYSQL_*`、`REDIS_*`、`RABBITMQ_*` 等，与 `application.yml` 占位符对齐即可；这是「本地用环境变量、生产用 Nacos」的**分工**，不必改成生产也在容器里写 MySQL。

若希望本地与生产**完全同一套路**，可改为本机也只配 `NACOS_*`，把中间件写在 Nacos 的 `nexus-*-local.yml`（需起可访问的 Nacos）。

### Mac 应用

同样通过推送 tag 发布（与后端共用同一 tag）：

- 构建 DMG 并上传到 GitHub Releases
- 自动更新 Homebrew Tap (`brew install tdragon8113/tap/nexus-tools`)

需要配置 GitHub Secrets：`TAP_TOKEN`（有 homebrew-tap 写权限的 PAT）

## 注意事项

- 生产环境数据库等敏感配置通过 Nacos 读取，禁止硬编码进镜像；本地可用 `.env`（勿提交）
- 测试覆盖率要求 80%+
- 禁止跳过测试提交