# Nexus Tools - Phase 1: 架构基础设计

**日期**: 2026-04-06
**状态**: 设计完成，待实现
**项目**: nexus-tools

---

## 1. 项目概述

Nexus Tools 是一款专为开发者打造的工具箱，集开发工具和个人效率管理于一体。采用 Mac 应用前端 + Spring Boot 微服务后端的云端原生架构。

**Phase 1 目标**: 搭建完整的架构基础，包括：
- Mac 应用骨架（SwiftUI、菜单栏、窗口管理）
- Spring Boot 后端微服务框架
- Docker 部署配置
- 数据库设计

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| Mac 应用 | SwiftUI + GRDB.swift | macOS Sonoma 14.0+ |
| 后端网关 | Spring Cloud Gateway | Java 21 |
| 后端服务 | Spring Boot 3.x | Java 21 |
| 数据库 | MySQL | 8.0 |
| 缓存/Session | Redis | 7.x |
| 服务注册/配置 | Nacos | 2.x |
| 消息队列 | RabbitMQ | 3.x |
| 容器化 | Docker + Docker Compose | - |

---

## 3. 项目结构

```
nexus-tools/
├── mac-app/                    # Mac 应用
│   ├── NexusTools/
│   │   ├── App/
│   │   │   ├── NexusToolsApp.swift      # 应用入口
│   │   │   ├── AppDelegate.swift        # 菜单栏管理
│   │   ├── Models/                       # 数据模型
│   │   ├── Views/                        # SwiftUI 视图
│   │   ├── ViewModel/                    # 业务逻辑
│   │   ├── Services/                     # 网络请求、本地存储
│   │   ├── Utils/                        # 工具类
│   │   └── Resources/                    # Assets、本地化
│   ├── NexusTools.xcodeproj/
│   └── NexusToolsTests/
│
├── backend/                    # 后端微服务
│   ├── nexus-gateway/          # API 网关
│   │   ├── src/main/java/
│   │   │   └── com/nexus/gateway/
│   │   │       ├── config/              # 路由、跨域、限流配置
│   │   │       ├── filter/              # Session 校验过滤器
│   │   │       └ NexusGatewayApplication.java
│   │   └──── pom.xml
│   │
│   ├── nexus-user-service/     # 用户服务
│   │   ├── src/main/java/
│   │   │   └── com/nexus/user/
│   │   │       ├── controller/          # 登录、注册、用户信息
│   │   │       ├── service/
│   │   │       ├── mapper/              # MyBatis Mapper
│   │   │       ├── entity/
│   │   │       ├── config/              # Redis Session 配置
│   │   │       └ NexusUserApplication.java
│   │   └──── pom.xml
│   │
│   ├── nexus-workspace-service/ # 工作空间服务
│   │   ├── src/main/java/
│   │   │   └ com/nexus/workspace/
│   │   │       ├── controller/          # 待办、活动记录、同步
│   │   │       ├── service/
│   │   │       ├── mapper/
│   │   │       ├── entity/
│   │   │       ├── config/              # RabbitMQ 消息队列
│   │   │       └ NexusWorkspaceApplication.java
│   │   └── pom.xml
│   │
│   ├── nexus-common/           # 公共模块（DTO、工具类、常量）
│   │   ├── src/main/java/
│   │   │   └ com/nexus/common/
│   │   │       ├── dto/                 # 统一响应封装
│   │   │       ├── exception/           # 全局异常处理
│   │   │       ├── utils/
│   │   │       └ constants/
│   │   └── pom.xml
│   │
│   └── pom.xml                 # 父 POM（版本管理）
│
├── docker/                     # Docker 配置（仅后端服务）
│   ├── docker-compose.yml      # 网关 + 两个微服务
│   ├── gateway/Dockerfile
│   ├── user-service/Dockerfile
│   ├── workspace-service/Dockerfile
│   └── nginx.conf              # 如需反向代理
│
├── docs/                       # 文档
│   ├── api/                    # API 文档
│   ├── architecture/           # 架构图
│   └── superpowers/specs/      # 设计文档
│
├── CLAUDE.md                   # 项目指南
├── README.md
└── .gitignore
```

---

## 4. Mac 应用架构

### 4.1 核心组件

| 组件 | 职责 | 技术 |
|------|------|------|
| **AppEntry** | 应用入口，初始化菜单栏、数据库、网络服务 | SwiftUI App |
| **MenuBarManager** | 管理菜单栏图标、状态、点击事件 | NSStatusBar + NSMenu |
| **WindowManager** | 管理小窗口（CMD+K）和弹出大窗口 | NSPanel + NSWindow |
| **NavigationRouter** | 工具导航、路由跳转 | SwiftUI NavigationStack |
| **LocalDatabase** | 本地数据存储、查询、迁移 | GRDB.swift + SQLite |
| **NetworkService** | 后端 API 请求、Session 管理 | URLSession + async/await |
| **SyncEngine** | 离线优先同步、冲突解决、版本管理 | 待 Phase 3 实现 |

### 4.2 窗口模式（混合模式）

- **小窗口 (NSPanel)**: CMD+K 快速唤起，用于工具快速操作（JSON 格式化、Base64 编解码）
- **大窗口 (NSWindow)**: 从小窗口点击弹出，用于深度操作（Markdown 编辑、统计报告）

```
┌─────────────────────────────────────────────────────┐
│  菜单栏图标 [N]                                       │
├─────────────────────────────────────────────────────┤
│  CMD+K 唤起小窗口 (NSPanel)                          │
│  ┌──────────────────────────┐                       │
│  │ 🔍 搜索工具...            │                       │
│  ├──────────────────────────┤                       │
│  │ JSON 工具    ⌘J          │                       │
│  │ Base64      ⌘B          │                       │
│  │ 待办事项    ⌘T          │                       │
│  │ Markdown    ⌘M          │                       │
│  │ ─────────────────────── │                       │
│  │ 时间追踪    ⌘R          │                       │
│  │ 统计报告    ⌘S          │  → 点击弹出大窗口      │
│  └──────────────────────────┘                       │
└─────────────────────────────────────────────────────┘
```

### 4.3 本地数据库表（GRDB.swift）

```sql
-- 用户信息（本地缓存）
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    session_token TEXT,          -- Session ID
    last_sync_at DATETIME,
    created_at DATETIME NOT NULL
);

-- 同步元数据（后续功能用）
CREATE TABLE sync_metadata (
    entity_type TEXT PRIMARY KEY,  -- 'todo', 'activity', 'setting'
    last_sync_version INTEGER,
    last_sync_at DATETIME
);

-- 应用配置
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL
);
```

---

## 5. 后端微服务架构

### 5.1 服务职责

| 服务 | 端口 | 职责 |
|------|------|------|
| `nexus-gateway` | 8080 | API 网关：路由转发、Session 校验、限流、日志 |
| `nexus-user-service` | 8081 | 用户注册、登录、Session 管理、用户信息 |
| `nexus-workspace-service` | 8082 | 待办事项、活动记录、数据同步、统计报告 |

### 5.2 服务调用关系

```
┌─────────────┐
│  Mac App    │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────────────────────────────────────┐
│                 nexus-gateway (8080)                │
│  ┌─────────────────────────────────────────────┐    │
│  │ 过滤器链：                                    │    │
│  │  1. 请求日志                                 │    │
│  │  2. Session 校验 (Redis)                     │    │
│  │  3. 限流检查                                 │    │
│  │  4. 路由转发                                 │    │
│  └─────────────────────────────────────────────┘    │
└─────────┬───────────────────────────┬───────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌─────────────────────────┐
│ nexus-user-service  │     │ nexus-workspace-service │
│      (8081)         │     │        (8082)           │
│                     │     │                         │
│ • /auth/login       │     │ • /todo/**              │
│ • /auth/register    │     │ • /activity/**          │
│ • /auth/logout      │     │ • /sync/**              │
│ • /user/profile     │     │ • /report/**            │
└─────────────────────┘     └─────────────────────────┘
```

### 5.3 中间件使用

| 中间件 | 用途 |
|------|------|
| **Nacos** | 服务注册发现、配置中心（各服务启动时注册到 Nacos） |
| **Redis** | Session 存储（Spring Session）、限流计数、缓存 |
| **MySQL** | 用户数据、待办事项、活动记录持久化 |
| **RabbitMQ** | 同步事件通知（待 Phase 3 实现）、异步任务队列 |

### 5.4 API 规范

```
基础路径：/api/v1/

统一响应格式：
{
    "code": 200,           // 业务状态码
    "message": "success",  // 提示信息
    "data": { ... }        // 业务数据
}

错误响应：
{
    "code": 400,
    "message": "参数校验失败",
    "data": null
}

Session 认证：
- 请求头：Cookie: SESSION=xxx
- Redis 存储：spring:session:NexusTools:SESSION:xxx
- 过期时间：7 天（可配置）
```

---

## 6. 数据库设计（MySQL）

### 6.1 nexus-user-service 数据库 `nexus_user`

```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,    -- BCrypt 加密
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    status TINYINT DEFAULT 1,               -- 1: 正常, 0: 禁用
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

### 6.2 nexus-workspace-service 数据库 `nexus_workspace`

```sql
-- 待办事项表
CREATE TABLE todos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status TINYINT DEFAULT 0,               -- 0: 待办, 1: 进行中, 2: 已完成, 3: 已删除
    priority TINYINT DEFAULT 1,             -- 1: 低, 2: 中, 3: 高
    due_date DATETIME,
    completed_at DATETIME,
    version INT DEFAULT 1,                  -- 同步版本号
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_due_date (user_id, due_date)
);

-- 活动记录表（时间追踪）
CREATE TABLE activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50),                   -- 分类：工作、学习、娱乐等
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT,                   -- 持续时长（分钟）
    notes TEXT,
    version INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_start_time (user_id, start_time),
    INDEX idx_user_category (user_id, category)
);

-- 同步版本表
CREATE TABLE sync_versions (
    user_id BIGINT PRIMARY KEY,
    todo_version INT DEFAULT 0,
    activity_version INT DEFAULT 0,
    last_sync_at DATETIME,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 7. Docker 部署设计

### 7.1 docker-compose.yml

```yaml
version: '3.8'

services:
  nexus-gateway:
    build:
      context: ../backend/nexus-gateway
      dockerfile: Dockerfile
    container_name: nexus-gateway
    ports:
      - "8080:8080"
    environment:
      - NACOS_SERVER_ADDR=${NACOS_ADDR}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PORT=${REDIS_PORT}
    depends_on:
      - nexus-user-service
      - nexus-workspace-service
    networks:
      - nexus-network

  nexus-user-service:
    build:
      context: ../backend/nexus-user-service
      dockerfile: Dockerfile
    container_name: nexus-user-service
    ports:
      - "8081:8081"
    environment:
      - NACOS_SERVER_ADDR=${NACOS_ADDR}
      - MYSQL_HOST=${MYSQL_HOST}
      - MYSQL_PORT=${MYSQL_PORT}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PORT=${REDIS_PORT}
    networks:
      - nexus-network

  nexus-workspace-service:
    build:
      context: ../backend/nexus-workspace-service
      dockerfile: Dockerfile
    container_name: nexus-workspace-service
    ports:
      - "8082:8082"
    environment:
      - NACOS_SERVER_ADDR=${NACOS_ADDR}
      - MYSQL_HOST=${MYSQL_HOST}
      - MYSQL_PORT=${MYSQL_PORT}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - RABBITMQ_HOST=${RABBITMQ_HOST}
      - RABBITMQ_PORT=${RABBITMQ_PORT}
    networks:
      - nexus-network

networks:
  nexus-network:
    driver: bridge
```

### 7.2 Dockerfile 模板

```dockerfile
# nexus-user-service/Dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/nexus-user-service-*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 7.3 环境变量配置 `.env`

```env
# 中间件地址（已存在的服务）
NACOS_ADDR=nacos-server:8848
MYSQL_HOST=mysql-server
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
REDIS_HOST=redis-server
REDIS_PORT=6379
RABBITMQ_HOST=rabbitmq-server
RABBITMQ_PORT=5672
```

### 7.4 Nacos 配置结构

```
命名空间：nexus-tools

配置列表：
├── nexus-common.yaml           # 公共配置（Redis、异常处理）
├── nexus-gateway.yaml          # 网关路由规则、限流配置
├── nexus-user-service.yaml     # 用户服务数据库配置
├── nexus-workspace-service.yaml # 工作空间服务数据库配置
```

---

## 8. 错误处理

### 8.1 Mac 应用

| 场景 | 处理方式 |
|------|----------|
| 网络请求失败 | Toast 提示 + 自动重试（最多 3 次） |
| Session 过期 | 本地数据正常使用，提示重新登录 |
| 数据库操作失败 | 日志记录 + 降级处理（不影响 UI） |
| JSON 解析错误 | 工具页面内直接显示错误信息 |

```swift
// 网络错误示例
enum NetworkError: Error {
    case noConnection
    case sessionExpired
    case serverError(Int)
    case timeout
}

func handle(error: NetworkError) {
    switch error {
    case .noConnection:
        showToast("网络不可用，数据仅保存本地")
    case .sessionExpired:
        showLoginPrompt()
    case .serverError(let code):
        showToast("服务异常 (\(code))，稍后重试")
    case .timeout:
        showToast("请求超时，正在重试...")
        retryRequest()
    }
}
```

### 8.2 后端服务

```java
// nexus-common 全局异常处理
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ApiResponse<?> handleBusiness(BusinessException e) {
        return ApiResponse.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors()
            .stream().map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleUnknown(Exception e) {
        log.error("未知异常", e);
        return ApiResponse.error(500, "系统异常");
    }
}
```

---

## 9. 测试策略

### 9.1 Mac 应用

| 类型 | 覆盖范围 | 工具 |
|------|----------|------|
| 单元测试 | 工具逻辑（JSON 解析、Base64 编解码）、数据库操作 | XCTest |
| UI 测试 | 核心用户流程（CMD+K 启动、工具切换、待办增删） | XCTest + XCUI 自动化 |

### 9.2 后端服务

| 类型 | 覆盖范围 | 工具 |
|------|----------|------|
| 单元测试 | Service 层业务逻辑、工具类 | JUnit 5 + Mockito |
| 集成测试 | Controller + Service + Mapper 全链路 | @SpringBootTest + Testcontainers |
| API 测试 | 端到端接口验证 | MockMvc 或 RestAssured |

### 9.3 覆盖率目标

**80%+**（符合全局配置）

---

## 10. 后续阶段规划

| 阶段 | 子项目 | 说明 |
|------|--------|------|
| **Phase 2** | 本地工具集 | JSON工具、文本处理、编码解码（纯本地，无后端依赖） |
| **Phase 3** | 用户系统 | 登录注册、账户管理、云端同步基础设施 |
| **Phase 4** | 待办+时间管理 | 待办事项、活动记录、统计报告（依赖用户系统） |
| **Phase 5** | 主题+快捷键 | 主题系统、CMD+K启动器、自定义快捷键 |