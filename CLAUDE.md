# Nexus Tools

一站式开发者工具箱，提供 JSON 格式化、Base64 编解码、时间戳转换、二维码生成等常用工具。

## 技术栈

| 模块 | 技术 | 端口 |
|------|------|------|
| Web 前端 | Nuxt 4 + Vue 3 + Tailwind CSS + Vant 4 | 8888 |
| Mac 应用 | SwiftUI + GRDB.swift (macOS 14.0+) | - |
| 网关 | Spring Cloud Gateway | 8080 |
| 用户服务 | Spring Boot 3.x + MyBatis | 8081 |
| 工作区服务 | Spring Boot 3.x + MyBatis | 8082 |
| 中间件 | MySQL, Redis, Nacos, RabbitMQ | - |

## 项目结构

```
nexus-tools/
├── web/                        # Web 前端（Nuxt 4）
│   ├── app/                    # Nuxt app 目录
│   │   ├── pages/              # 页面组件
│   │   └── app.vue             # 根组件
│   ├── lib/                    # API 客户端
│   ├── nginx.conf              # nginx 反向代理配置
│   └── Dockerfile              # 前端容器
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

### Web 前端

```bash
cd web
npm install
npm run dev     # 开发模式 http://localhost:3000
npm run build   # 生产构建（预渲染静态页面）
```

前端使用预渲染生成静态 HTML，nginx 反向代理 `/api/` 到网关。

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

推送 tag 触发 GitHub Actions 全栈部署：

```bash
git tag v1.0.0 && git push origin v1.0.0
```

部署内容：
- 前端 Docker 镜像 → Aliyun ACR → 端口 8888
- 后端服务镜像 → Aliyun ACR → 端口 8080/8081/8082
- Mac DMG → GitHub Releases → Homebrew Tap

访问地址：`https://your-server:8888/`

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

确保 `nuxt.config.ts` 配置了预渲染：

```typescript
nitro: {
  prerender: {
    crawlLinks: true,
    routes: ['/', '/auth/login', '/auth/register', '/profile']
  }
}
```

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