# Nexus Tools 项目结构文档

## 项目概述

Nexus Tools 是一个多端开发者工具箱项目，包含：
- **Web 前端**：响应式网页版，支持手机和电脑
- **Mac 应用**：原生 macOS 应用
- **后端微服务**：Spring Cloud 架构的 API 服务

---

## 目录结构总览

```
nexus-tools/
│
├── web/                          # [前端] Nuxt 4 Web 应用
│   ├── app/                      # Nuxt 4 app 目录（核心代码）
│   │   ├── app.vue               # 根组件，定义布局骨架
│   │   └── pages/                # 页面路由（基于文件路由）
│   │       ├── index.vue         # 首页 - 工具卡片网格
│   │       ├── auth/             # 认证相关页面
│   │       │   ├── login.vue     # 登录页
│   │       │   └── register.vue  # 注册页
│   │       └── profile.vue       # 个人中心页
│   │
│   ├── lib/                      # 共享库
│   │   └── api.ts                # API 客户端（fetch 封装）
│   │
│   ├── public/                   # 静态资源
│   │   ├── favicon.svg           # 网站图标
│   │   └── favicon.ico           # 备用图标
│   │
│   ├── assets/css/               # 全局样式
│   │   └── main.css              # Tailwind 入口 + 自定义样式
│   │
│   ├── nuxt.config.ts            # Nuxt 配置（模块、预渲染、SEO）
│   ├── tailwind.config.js        # Tailwind 配置
│   ├── package.json              # 前端依赖
│   ├── Dockerfile                # 前端容器镜像（nginx）
│   └── nginx.conf                # nginx 反向代理配置
│
├── mac-app/                      # [Mac 应用] SwiftUI 原生应用
│   ├── NexusTools.xcodeproj/     # Xcode 项目
│   ├── NexusTools/
│   │   ├── App/
│   │   │   ├── NexusToolsApp.swift  # App 入口
│   │   │   └── AppDelegate.swift    # AppDelegate
│   │   ├── Models/
│   │   │   └── User.swift           # 用户数据模型
│   │   ├── Services/
│   │   │   └ NetworkService.swift   # 网络请求服务
│   │   ├── Views/
│   │   │   ├── QuickLaunchView.swift # 主界面
│   │   │   ├── Auth/                # 认证视图
│   │   │   │   ├── AuthView.swift
│   │   │   │   ├── LoginView.swift
│   │   │   │   └ RegisterView.swift
│   │   │   └── Profile/             # 个人中心视图
│   │   │       └ ProfileView.swift
│   │   └ Info.plist                 # 应用配置
│   │   └ Assets.xcassets            # 图片资源
│   │
│   └── NexusTools.xcodeproj/       # Xcode 项目配置
│
├── backend/                       # [后端] Spring Cloud 微服务
│   │
│   ├── nexus-gateway/             # API 网关 (:8080)
│   │   ├── src/main/java/
│   │   │   └ com/nexus/gateway/
│   │   │     ├── NexusGatewayApplication.java  # 启动类
│   │   │     ├── config/                       # 配置类
│   │   │     │   ├── CorsConfig.java           # CORS 配置
│   │   │     │   └ RouteConfig.java           # 路由配置
│   │   │     └── filter/                       # 过滤器
│   │   │         ├── AuthFilter.java           # 认证过滤器
│   │   │         └ RequestLogFilter.java       # 请求日志
│   │   │
│   │   ├── src/main/resources/
│   │   │   ├── application.yml                 # 主配置
│   │   │   └── bootstrap.yml                   # Nacos 配置
│   │   │
│   │   └ pom.xml                               # Maven 依赖
│   │
│   ├── nexus-user-service/        # 用户服务 (:8081)
│   │   ├── src/main/java/
│   │   │   └ com/nexus/user/
│   │   │     ├── NexusUserApplication.java    # 启动类
│   │   │     ├── controller/                  # API 控制器
│   │   │     │   ├── UserController.java      # 用户接口
│   │   │     │   └ AuthController.java        # 认证接口
│   │   │     ├── service/                     # 业务逻辑
│   │   │     │   ├── UserService.java
│   │   │     │   └ AuthService.java
│   │   │     ├── mapper/                      # MyBatis Mapper
│   │   │     │   ├── UserMapper.java
│   │   │     ├── entity/                      # 数据实体
│   │   │     │   ├── User.java
│   │   │     ├── dto/                         # 数据传输对象
│   │   │     │   ├── LoginDTO.java
│   │   │     │   ├── RegisterDTO.java
│   │   │     │   ├── UserVO.java
│   │   │     ├── config/                      # 配置类
│   │   │     │   ├── SecurityConfig.java      # 安全配置
│   │   │     │   ├── RedisConfig.java         # Redis 配置
│   │   │     └ exception/                     # 异常处理
│   │   │     │   ├── GlobalExceptionHandler.java
│   │   │     │   ├── BusinessException.java
│   │   │
│   │   ├── src/main/resources/
│   │   │   ├── application.yml                # 主配置
│   │   │   ├── mapper/                        # MyBatis XML
│   │   │   │   └ UserMapper.xml
│   │   │
│   │   └ pom.xml
│   │
│   ├── nexus-workspace-service/   # 工作区服务 (:8082)
│   │   ├── src/main/java/
│   │   │   └ com/nexus/workspace/
│   │   │     ├── NexusWorkspaceApplication.java
│   │   │     ├── controller/
│   │   │     ├── service/
│   │   │     ├── mapper/
│   │   │     ├── entity/
│   │   │
│   │   ├── src/main/resources/
│   │   │   ├── application.yml
│   │   │
│   │   └ pom.xml
│   │
│   └── pom.xml                    # 父 POM（依赖管理）
│
├── docker/                        # Docker 配置
│   ├── docker-compose.prod.yml    # 生产环境编排
│   ├── gateway/
│   │   └ Dockerfile              # 网关镜像
│   ├── user-service/
│   │   └ Dockerfile              # 用户服务镜像
│   └── workspace-service/
│   │   └ Dockerfile              # 工作区服务镜像
│
├── .github/workflows/             # GitHub Actions CI/CD
│   ├── deploy.yml                 # 全栈部署（前端 + 后端）
│   ├── mac-app.yml                # Mac 应用构建 + DMG 发布
│   └── frontend.yml               # （已废弃，合并到 deploy.yml）
│
├── .env.example                   # 本地环境变量模板
├── CLAUDE.md                      # AI 开发指南
├── CHANGELOG.md                   # 版本更新日志
├── README.md                      # 项目说明
└── pom.xml                        # 根 POM（空壳，指向 backend）
```

---

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户访问                                   │
│                   https://server:8888                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   nexus-frontend (nginx)                         │
│                      端口: 8888                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  静态 HTML (预渲染)                                           │ │
│  │  /_nuxt/*.js, *.css                                          │ │
│  │  /index.html, /auth/login, /auth/register, /profile         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  反向代理                                                    │ │
│  │  /api/* → nexus-gateway:8080                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ /api/*
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   nexus-gateway (Spring Gateway)                 │
│                      端口: 8080                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  路由规则                                                    │ │
│  │  /api/user/**    → nexus-user-service:8081/user/**          │ │
│  │  /api/workspace/** → nexus-workspace-service:8082/workspace/**│ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  过滤器                                                      │ │
│  │  - 认证校验 (JWT)                                            │ │
│  │  - 请求日志                                                  │ │
│  │  - CORS 处理                                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────┬───────────────────┬─────────────────────────────────┘
              │                   │
              ▼                   ▼
┌─────────────────────┐   ┌─────────────────────┐
│ nexus-user-service  │   │ nexus-workspace-service│
│    端口: 8081       │   │    端口: 8082          │
│                     │   │                       │
│ 用户认证/个人中心    │   │ 工作区/工具管理        │
│ - 注册/登录         │   │ - 工具收藏            │
│ - JWT 生成          │   │ - 使用历史            │
│ - 用户信息          │   │ - 自定义配置          │
└─────────┬───────────┘   └─────────┬─────────────┘
          │                         │
          └───────────┬─────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        中间件层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    MySQL     │  │    Redis     │  │  RabbitMQ   │           │
│  │   数据存储    │  │   缓存/会话   │  │  消息队列   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Nacos                                   │ │
│  │  配置中心：nexus-gateway-prod.yml                            │ │
│  │           nexus-user-service-prod.yml                        │ │
│  │           nexus-workspace-service-prod.yml                   │ │
│  │  服务注册与发现                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 各模块详解

### 1. Web 前端 (web/)

**技术栈**: Nuxt 4 + Vue 3 + Tailwind CSS + Vant 4

**核心文件**:

| 文件 | 作用 |
|------|------|
| `nuxt.config.ts` | Nuxt 配置：模块加载、预渲染路由、SEO meta |
| `app/app.vue` | 根组件，包含 header + main + footer 骨架 |
| `app/pages/index.vue` | 首页，工具卡片网格布局 |
| `app/pages/auth/login.vue` | 登录表单，Vant 组件 |
| `lib/api.ts` | API 客户端，fetch 封装 + token 管理 |

**预渲染配置**:
```typescript
// nuxt.config.ts
nitro: {
  prerender: {
    crawlLinks: true,
    routes: ['/', '/auth/login', '/auth/register', '/profile']
  }
}
```

**nginx 反向代理**:
```nginx
# nginx.conf
location /api/ {
    proxy_pass http://nexus-gateway:8080/;
}
```

---

### 2. Mac 应用 (mac-app/)

**技术栈**: SwiftUI + GRDB.swift (macOS 14.0+)

**核心文件**:

| 文件 | 作用 |
|------|------|
| `App/NexusToolsApp.swift` | SwiftUI App 入口 |
| `Services/NetworkService.swift` | 网络请求，与后端 API 交互 |
| `Models/User.swift` | 用户数据模型 + GRDB 持久化 |
| `Views/QuickLaunchView.swift` | 主界面，工具快捷入口 |

**发布流程**:
1. 推送 tag 触发 GitHub Actions
2. 构建 DMG 并上传 GitHub Releases
3. 自动更新 Homebrew Tap

---

### 3. 后端微服务 (backend/)

#### nexus-gateway（网关）

**职责**: 统一 API 入口、路由分发、认证校验

| 文件 | 作用 |
|------|------|
| `config/RouteConfig.java` | 定义路由规则 |
| `filter/AuthFilter.java` | JWT 认证过滤器 |
| `filter/RequestLogFilter.java` | 请求日志记录 |

#### nexus-user-service（用户服务）

**职责**: 用户注册、登录、个人中心

| 文件 | 作用 |
|------|------|
| `controller/AuthController.java` | 登录/注册 API |
| `controller/UserController.java` | 用户信息 API |
| `service/AuthService.java` | JWT 生成、密码校验 |
| `mapper/UserMapper.java` | 用户数据访问 |

**API 接口**:
- `POST /user/auth/register` - 注册
- `POST /user/auth/login` - 登录（返回 JWT）
- `GET /user/profile` - 获取用户信息（需认证）

#### nexus-workspace-service（工作区服务）

**职责**: 工具收藏、使用历史、自定义配置

---

### 4. Docker 部署 (docker/)

**docker-compose.prod.yml** 定义 4 个服务:

| 服务 | 镜像 | 端口 |
|------|------|------|
| nexus-frontend | nginx + 预渲染静态页 | 8888:80 |
| nexus-gateway | Spring Gateway JAR | 8080:8080 |
| nexus-user-service | Spring Boot JAR | 8081:8081 |
| nexus-workspace-service | Spring Boot JAR | 8082:8082 |

**环境变量**:
```yaml
NACOS_SERVER_ADDR: nacos服务器地址
NACOS_USERNAME: nacos用户名
NACOS_PASSWORD: nacos密码
SPRING_PROFILES_ACTIVE: prod
```

---

### 5. CI/CD (.github/workflows/)

#### deploy.yml（全栈部署）

**触发**: 推送 tag `v*`

**流程**:
1. **Build Frontend**: npm build → 预渲染 → artifact
2. **Build Backend**: Maven install → JAR artifacts
3. **Push Frontend Image**: Docker build → Aliyun ACR
4. **Push Backend Images**: Docker build → Aliyun ACR
5. **Deploy**: SSH 到服务器 → docker-compose pull + up

#### mac-app.yml（Mac 应用发布）

**流程**:
1. xcodebuild 构建 DMG
2. 上传到 GitHub Releases
3. 更新 Homebrew Tap

---

## 配置管理

### 本地开发

使用 `.env` 文件（参考 `.env.example`）:

```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=nexus
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

NACOS_SERVER_ADDR=localhost:8848
NACOS_USERNAME=nacos
NACOS_PASSWORD=nacos
```

### 生产环境

使用 Nacos 配置中心:

| Data ID | 内容 |
|---------|------|
| `nexus-gateway-prod.yml` | 网关路由、限流规则 |
| `nexus-user-service-prod.yml` | 数据库、Redis、JWT 配置 |
| `nexus-workspace-service-prod.yml` | 数据库、Redis 配置 |

---

## 开发工作流

### 新功能开发

1. 本地启动后端服务（加载 `.env`）
2. 本地启动前端 (`npm run dev`)
3. 开发 + 测试
4. 提交代码
5. 推送 tag 触发部署

### 热修复

1. 直接在服务器 `docker-compose restart <service>`
2. 或推送新 tag 重新部署

---

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| nginx 显示默认页面 | 检查预渲染是否生成 `index.html` |
| 后端服务启动失败 | 检查 Nacos 连接和配置文件 |
| 前端 API 请求失败 | 检查 nginx `/api/` 代理和网关路由 |
| Mac 应用网络错误 | 检查 `NetworkService.swift` 中的 API 地址 |

---

## 相关文档

- [CLAUDE.md](./CLAUDE.md) - AI 开发指南
- [CHANGELOG.md](./CHANGELOG.md) - 版本更新日志
- [.env.example](./.env.example) - 环境变量模板