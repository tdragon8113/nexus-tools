# Nexus Tools

一站式开发者工具箱，提供 JSON 格式化、Base64 编解码、时间戳转换、二维码生成等常用工具。

## 技术栈

| 模块 | 技术 | 端口 |
|------|------|------|
| Web 小工具 | Nuxt 4 + Vue 3 + Tailwind CSS + Vant 4 | 8888 |
| Web 时间管理 | Nuxt 4 + Vue 3 + Tailwind CSS + Vant 4 | 8889 |
| Mac 应用 | SwiftUI + GRDB.swift (macOS 14.0+) | - |
| 网关 | Spring Cloud Gateway | 8080 |
| 用户服务 | Spring Boot 3.x + MyBatis | 8081 |
| 工作区服务 | Spring Boot 3.x + MyBatis | 8082 |
| 中间件 | MySQL, Redis, Nacos, RabbitMQ | - |

## 项目结构

```
nexus-tools/
├── web-tools/                  # 纯静态小工具（不接网关 API）
│   ├── app/
│   ├── nginx.conf
│   └── Dockerfile             # 镜像 nexus-frontend → :8888
├── web-time/                   # 时间管理 + 登录/个人中心（nginx 代理 /api）
│   ├── app/
│   ├── nginx.conf
│   └── Dockerfile             # 镜像 nexus-frontend-time → :8889
├── mac-app/                    # Mac 应用
│   └── NexusTools.xcodeproj
├── backend/                    # 后端微服务
│   ├── nexus-gateway/          # API 网关
│   ├── nexus-user-service/     # 用户认证/个人中心
│   └── nexus-workspace-service/ # 工作区管理
├── docker/                     # Docker Compose 配置
│   └── docker-compose.prod.yml # 生产环境编排
└── .github/workflows/          # CI/CD
    ├── deploy.yml              # 全栈部署
    └── mac-app.yml             # Mac 应用发布
```

## 本地开发

### Web 小工具（web-tools）

```bash
cd web-tools
npm install
npm run dev     # http://localhost:3000
npm run build
```

### Web 时间管理（web-time）

```bash
cd web-time
npm install
npm run dev     # http://localhost:3001
npm run build
```

`NUXT_PUBLIC_API_BASE`：网关基址（默认本地 `http://localhost:8080`）。

**web-time** 为预渲染静态资源，其 `nginx.conf` 将 `/api/` 反向代理到网关。

### 后端

环境变量注入中间件配置，无需 `application-local.yml`：

```bash
# 1. 复制并编辑环境变量
cp .env.example .env

# 2. 加载环境变量
set -a && source .env && set +a

# 3. 构建
cd backend && mvn clean install -DskipTests

# 4. 启动服务
java -jar nexus-gateway/target/*.jar
java -jar nexus-user-service/target/*.jar
java -jar nexus-workspace-service/target/*.jar
```

**IntelliJ IDEA**：Run Configuration → Environment variables，填入 `.env.example` 中的变量。

### Mac 应用

打开 `mac-app/NexusTools.xcodeproj`，Build & Run。

## 生产部署

版本 tag 规则见 [`docs/RELEASE_TAGS.md`](docs/RELEASE_TAGS.md)（**不同前缀触发不同流水线**）。

**仅桌面端（web-tools Electron）**：

```bash
git tag web-tools-v0.2.0 && git push origin web-tools-v0.2.0
```

→ `NexusTools.dmg`、GitHub Release、`brew install --cask nexus-tools`

**生产全栈部署**（web-tools + web-time + 后端，**不会**随 `web-tools-v*` 触发）：

```bash
git tag deploy-v1.0.13 && git push origin deploy-v1.0.13
```

或在 Actions 手动运行 **Build and Deploy to Aliyun**。

部署内容：
- 小工具前端镜像 `nexus-frontend` → 端口 **8888**
- 时间管理前端镜像 `nexus-frontend-time` → 端口 **8889**
- 后端服务镜像 → Aliyun ACR → 端口 8080/8081/8082

访问地址示例：`https://your-server:8888/`（小工具）、`https://your-server:8889/`（时间管理）。部署后需在构建时注入上述 `NUXT_PUBLIC_*`，保证两站导航链接正确。

## 配置管理

| 环境 | 配置位置 |
|------|----------|
| 本地 | `.env` 文件（勿提交） |
| 生产 | Nacos 配置中心（Data ID: `nexus-*-prod.yml`） |

敏感配置（数据库密码、Redis 密码等）禁止硬编码，仅通过 Nacos 或 `.env` 注入。

## 代码规范

### 通用

- 测试覆盖率 ≥ 80%
- 禁止跳过测试提交
- 使用不可变数据结构，避免副作用
- 错误必须显式处理，禁止静默吞掉
- 系统边界验证所有输入

### 前端（Web）

- 组件命名：PascalCase
- CSS：Tailwind 原子类 + 自定义 CSS 变量
- 动画：仅使用 compositor-friendly 属性（transform, opacity）
- 文件组织：按功能/页面，不按类型

### 后端（Java/Spring）

- Controller → Service → Repository 分层
- API 响应格式：`{ success, data?, error?, meta? }`
- 异常处理：全局异常处理器 + 业务异常类
- MyBatis XML 放在 `resources/mapper/`

## API 路由

通过网关统一入口：

| 前端路径 | 后端服务 | 实际路径 |
|----------|----------|----------|
| `/api/user/*` | nexus-user-service | `/user/*` |
| `/api/workspace/*` | nexus-workspace-service | `/workspace/*` |

## 常见问题

### 前端显示 nginx 默认页面

确保 `nuxt.config.ts` 为需预渲染的路由配置了 `nitro.prerender.routes`（`web-tools` 仅首页与工具页；`web-time` 含认证与 `/manage/time` 子路由）。

### 后端服务启动失败

检查 Nacos 连接：
- `NACOS_SERVER_ADDR` 是否正确
- `NACOS_USERNAME` / `NACOS_PASSWORD` 是否匹配
- Nacos 中是否存在对应的配置文件

### GitHub Actions 构建失败

查看日志：
```bash
gh run view --log
```