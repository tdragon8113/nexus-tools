# Nexus Tools Phase 1: 架构基础实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 Mac 应用骨架 + Spring Boot 微服务后端 + Docker 部署配置的完整架构基础

**Architecture:** Mac 应用采用 SwiftUI + GRDB.swift 实现菜单栏应用和本地存储；后端采用 Spring Cloud Gateway + 两个微服务（user-service、workspace-service），通过 Nacos 注册发现，Session 存储在 Redis，数据持久化到 MySQL

**Tech Stack:** SwiftUI/GRDB (Mac), Spring Boot 3.x/Spring Cloud Gateway/MyBatis (后端), Docker/Docker Compose (部署)

---

## 文件结构总览

### Mac 应用文件

| 文件 | 职责 |
|------|------|
| `mac-app/NexusTools/App/NexusToolsApp.swift` | 应用入口，初始化数据库和菜单栏 |
| `mac-app/NexusTools/App/AppDelegate.swift` | 菜单栏图标管理、NSPanel 窗口控制 |
| `mac-app/NexusTools/Services/DatabaseService.swift` | GRDB 数据库连接、表创建、迁移 |
| `mac-app/NexusTools/Models/User.swift` | 用户本地模型 |
| `mac-app/NexusTools/Models/AppSetting.swift` | 应用设置模型 |
| `mac-app/NexusTools/Services/NetworkService.swift` | URLSession 网络请求封装 |
| `mac-app/NexusTools/Views/MainView.swift` | 主界面（工具列表） |
| `mac-app/NexusTools/Views/QuickLaunchView.swift` | CMD+K 快速启动面板 |

### 后端文件

| 文件 | 职责 |
|------|------|
| `backend/pom.xml` | 父 POM，版本管理 |
| `backend/nexus-common/pom.xml` | 公共模块 POM |
| `backend/nexus-common/src/main/java/com/nexus/common/dto/ApiResponse.java` | 统一响应封装 |
| `backend/nexus-common/src/main/java/com/nexus/common/exception/BusinessException.java` | 业务异常 |
| `backend/nexus-common/src/main/java/com/nexus/common/exception/GlobalExceptionHandler.java` | 全局异常处理 |
| `backend/nexus-gateway/pom.xml` | 网关 POM |
| `backend/nexus-gateway/src/main/java/com/nexus/gateway/NexusGatewayApplication.java` | 网关启动类 |
| `backend/nexus-gateway/src/main/java/com/nexus/gateway/config/RouteConfig.java` | 路由配置 |
| `backend/nexus-gateway/src/main/java/com/nexus/gateway/filter/SessionAuthFilter.java` | Session 校验过滤器 |
| `backend/nexus-user-service/pom.xml` | 用户服务 POM |
| `backend/nexus-user-service/src/main/java/com/nexus/user/NexusUserApplication.java` | 用户服务启动类 |
| `backend/nexus-user-service/src/main/java/com/nexus/user/entity/User.java` | 用户实体 |
| `backend/nexus-user-service/src/main/java/com/nexus/user/controller/AuthController.java` | 认证控制器 |
| `backend/nexus-user-service/src/main/java/com/nexus/user/service/AuthService.java` | 认证服务 |
| `backend/nexus-user-service/src/main/java/com/nexus/user/mapper/UserMapper.java` | 用户 Mapper |
| `backend/nexus-user-service/src/main/java/com/nexus/user/config/RedisSessionConfig.java` | Redis Session 配置 |
| `backend/nexus-workspace-service/pom.xml` | 工作空间服务 POM |
| `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/NexusWorkspaceApplication.java` | 工作空间服务启动类 |
| `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/entity/Todo.java` | 待办实体 |
| `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/entity/Activity.java` | 活动记录实体 |

### Docker 文件

| 文件 | 职责 |
|------|------|
| `docker/docker-compose.yml` | 服务编排 |
| `docker/.env.example` | 环境变量模板 |
| `docker/gateway/Dockerfile` | 网关镜像 |
| `docker/user-service/Dockerfile` | 用户服务镜像 |
| `docker/workspace-service/Dockerfile` | 工作空间服务镜像 |

---

## Part A: 后端公共模块

### Task 1: 创建父 POM

**Files:**
- Create: `backend/pom.xml`

- [ ] **Step 1: 创建父 POM 文件**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.nexus</groupId>
    <artifactId>nexus-tools</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>Nexus Tools Backend</name>
    <description>Nexus Tools Backend Services</description>

    <modules>
        <module>nexus-common</module>
        <module>nexus-gateway</module>
        <module>nexus-user-service</module>
        <module>nexus-workspace-service</module>
    </modules>

    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <spring-boot.version>3.2.5</spring-boot.version>
        <spring-cloud.version>2023.0.1</spring-cloud.version>
        <nacos.version>2023.0.1.0</nacos.version>
        <mybatis.version>3.0.3</mybatis.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Spring Cloud -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Nacos -->
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${nacos.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- MyBatis -->
            <dependency>
                <groupId>org.mybatis.spring.boot</groupId>
                <artifactId>mybatis-spring-boot-starter</artifactId>
                <version>${mybatis.version}</version>
            </dependency>

            <!-- 内部模块 -->
            <dependency>
                <groupId>com.nexus</groupId>
                <artifactId>nexus-common</artifactId>
                <version>${project.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring-boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

- [ ] **Step 2: 创建 backend 目录结构**

```bash
mkdir -p backend/nexus-common/src/main/java/com/nexus/common/{dto,exception,utils,constants}
mkdir -p backend/nexus-common/src/main/resources
```

- [ ] **Step 3: 提交**

```bash
git add backend/pom.xml
git commit -m "feat: add parent pom with version management"
```

---

### Task 2: 创建 nexus-common 模块

**Files:**
- Create: `backend/nexus-common/pom.xml`
- Create: `backend/nexus-common/src/main/java/com/nexus/common/dto/ApiResponse.java`
- Create: `backend/nexus-common/src/main/java/com/nexus/common/exception/BusinessException.java`
- Create: `backend/nexus-common/src/main/java/com/nexus/common/exception/GlobalExceptionHandler.java`
- Create: `backend/nexus-common/src/main/java/com/nexus/common/constants/ResultCode.java`

- [ ] **Step 1: 创建 nexus-common pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.nexus</groupId>
        <artifactId>nexus-tools</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>nexus-common</artifactId>
    <packaging>jar</packaging>

    <name>Nexus Common</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 ApiResponse 统一响应类**

```java
package com.nexus.common.dto;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage("success");
        response.setData(data);
        return response;
    }

    public static <T> ApiResponse<T> success() {
        return success(null);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        response.setData(null);
        return response;
    }

    public static <T> ApiResponse<T> error(String message) {
        return error(500, message);
    }
}
```

- [ ] **Step 3: 创建 ResultCode 常量类**

```java
package com.nexus.common.constants;

public final class ResultCode {
    public static final int SUCCESS = 200;
    public static final int BAD_REQUEST = 400;
    public static final int UNAUTHORIZED = 401;
    public static final int FORBIDDEN = 403;
    public static final int NOT_FOUND = 404;
    public static final int INTERNAL_ERROR = 500;
    
    public static final int USER_NOT_FOUND = 1001;
    public static final int USER_ALREADY_EXISTS = 1002;
    public static final int INVALID_PASSWORD = 1003;
    public static final int SESSION_EXPIRED = 1004;
}
```

- [ ] **Step 4: 创建 BusinessException 业务异常**

```java
package com.nexus.common.exception;

import com.nexus.common.constants.ResultCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(String message) {
        super(message);
        this.code = ResultCode.INTERNAL_ERROR;
    }

    public static BusinessException userNotFound() {
        return new BusinessException(ResultCode.USER_NOT_FOUND, "用户不存在");
    }

    public static BusinessException userAlreadyExists() {
        return new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户已存在");
    }

    public static BusinessException invalidPassword() {
        return new BusinessException(ResultCode.INVALID_PASSWORD, "密码错误");
    }

    public static BusinessException unauthorized() {
        return new BusinessException(ResultCode.UNAUTHORIZED, "未登录或 Session 已过期");
    }
}
```

- [ ] **Step 5: 创建 GlobalExceptionHandler 全局异常处理**

```java
package com.nexus.common.exception;

import com.nexus.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<?> handleBusiness(BusinessException e) {
        return ApiResponse.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors()
                .stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> handleUnknown(Exception e) {
        return ApiResponse.error(500, "系统异常: " + e.getMessage());
    }
}
```

- [ ] **Step 6: 提交**

```bash
git add backend/nexus-common/
git commit -m "feat: add nexus-common module with ApiResponse and exception handling"
```

---

## Part B: Gateway 服务

### Task 3: 创建 nexus-gateway 模块

**Files:**
- Create: `backend/nexus-gateway/pom.xml`
- Create: `backend/nexus-gateway/src/main/java/com/nexus/gateway/NexusGatewayApplication.java`
- Create: `backend/nexus-gateway/src/main/java/com/nexus/gateway/config/RouteConfig.java`
- Create: `backend/nexus-gateway/src/main/java/com/nexus/gateway/filter/SessionAuthFilter.java`
- Create: `backend/nexus-gateway/src/main/resources/application.yml`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p backend/nexus-gateway/src/main/java/com/nexus/gateway/{config,filter}
mkdir -p backend/nexus-gateway/src/main/resources
```

- [ ] **Step 2: 创建 gateway pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.nexus</groupId>
        <artifactId>nexus-tools</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>nexus-gateway</artifactId>
    <packaging>jar</packaging>

    <name>Nexus Gateway</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>com.nexus</groupId>
            <artifactId>nexus-common</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 3: 创建启动类**

```java
package com.nexus.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class NexusGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusGatewayApplication.class, args);
    }
}
```

- [ ] **Step 4: 创建 application.yml**

```yaml
server:
  port: 8080

spring:
  application:
    name: nexus-gateway
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
      config:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
        file-extension: yaml
        namespace: nexus-tools
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

logging:
  level:
    com.nexus.gateway: DEBUG
```

- [ ] **Step 5: 创建路由配置**

```java
package com.nexus.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RouteConfig {

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service", r -> r
                        .path("/api/v1/auth/**", "/api/v1/user/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://nexus-user-service"))
                .route("workspace-service", r -> r
                        .path("/api/v1/todo/**", "/api/v1/activity/**", "/api/v1/sync/**", "/api/v1/report/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://nexus-workspace-service"))
                .build();
    }
}
```

- [ ] **Step 6: 创建 Session 校验过滤器**

```java
package com.nexus.gateway.filter;

import com.nexus.common.exception.BusinessException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class SessionAuthFilter implements GlobalFilter, Ordered {

    private final StringRedisTemplate redisTemplate;
    
    // 不需要认证的路径
    private static final List<String> WHITE_LIST = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register"
    );

    public SessionAuthFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // 白名单路径直接放行
        if (WHITE_LIST.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        // 获取 Session Cookie
        HttpCookie sessionCookie = request.getCookies().getFirst("SESSION");
        if (sessionCookie == null) {
            exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String sessionId = sessionCookie.getValue();
        String sessionKey = "spring:session:NexusTools:SESSION:" + sessionId;

        // 检查 Session 是否存在
        String userId = redisTemplate.opsForValue().get(sessionKey + ":userId");
        if (userId == null) {
            exchange.getResponse().setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 将 userId 添加到请求头传递给下游服务
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userId)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
```

- [ ] **Step 7: 提交**

```bash
git add backend/nexus-gateway/
git commit -m "feat: add nexus-gateway with routes and session auth filter"
```

---

## Part C: User 服务

### Task 4: 创建 nexus-user-service 模块基础

**Files:**
- Create: `backend/nexus-user-service/pom.xml`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/NexusUserApplication.java`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/entity/User.java`
- Create: `backend/nexus-user-service/src/main/resources/application.yml`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p backend/nexus-user-service/src/main/java/com/nexus/user/{controller,service,mapper,entity,config}
mkdir -p backend/nexus-user-service/src/main/resources/mapper
```

- [ ] **Step 2: 创建 user-service pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.nexus</groupId>
        <artifactId>nexus-tools</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>nexus-user-service</artifactId>
    <packaging>jar</packaging>

    <name>Nexus User Service</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.nexus</groupId>
            <artifactId>nexus-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 3: 创建启动类**

```java
package com.nexus.user;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.nexus.user.mapper")
public class NexusUserApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusUserApplication.class, args);
    }
}
```

- [ ] **Step 4: 创建 User 实体**

```java
package com.nexus.user.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String username;
    private String email;
    private String passwordHash;
    private String nickname;
    private String avatarUrl;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 5: 创建 application.yml**

```yaml
server:
  port: 8081

spring:
  application:
    name: nexus-user-service
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
      config:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
        file-extension: yaml
        namespace: nexus-tools
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/nexus_user?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER:root}
    password: ${MYSQL_PASSWORD:root}
    driver-class-name: com.mysql.cj.jdbc.Driver
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true

logging:
  level:
    com.nexus.user: DEBUG
```

- [ ] **Step 6: 提交**

```bash
git add backend/nexus-user-service/
git commit -m "feat: add nexus-user-service base structure"
```

---

### Task 5: 创建用户认证功能

**Files:**
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/mapper/UserMapper.java`
- Create: `backend/nexus-user-service/src/main/resources/mapper/UserMapper.xml`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/service/AuthService.java`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/controller/AuthController.java`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/dto/LoginRequest.java`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/dto/RegisterRequest.java`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/dto/UserResponse.java`
- Create: `backend/nexus-user-service/src/main/java/com/nexus/user/config/RedisSessionConfig.java`

- [ ] **Step 1: 创建 DTO 类**

```java
package com.nexus.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}

@Data
public class RegisterRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度3-50")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度6-100")
    private String password;
}

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String nickname;
    private String avatarUrl;
}
```

- [ ] **Step 2: 创建 UserMapper**

```java
package com.nexus.user.mapper;

import com.nexus.user.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {
    User findByUsername(String username);
    User findByEmail(String email);
    User findById(Long id);
    int insert(User user);
    int update(User user);
}
```

- [ ] **Step 3: 创建 UserMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.nexus.user.mapper.UserMapper">

    <resultMap id="UserResultMap" type="com.nexus.user.entity.User">
        <id column="id" property="id"/>
        <result column="username" property="username"/>
        <result column="email" property="email"/>
        <result column="password_hash" property="passwordHash"/>
        <result column="nickname" property="nickname"/>
        <result column="avatar_url" property="avatarUrl"/>
        <result column="status" property="status"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <select id="findByUsername" resultMap="UserResultMap">
        SELECT * FROM users WHERE username = #{username}
    </select>

    <select id="findByEmail" resultMap="UserResultMap">
        SELECT * FROM users WHERE email = #{email}
    </select>

    <select id="findById" resultMap="UserResultMap">
        SELECT * FROM users WHERE id = #{id}
    </select>

    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (username, email, password_hash, nickname, avatar_url, status, created_at)
        VALUES (#{username}, #{email}, #{passwordHash}, #{nickname}, #{avatarUrl}, #{status}, #{createdAt})
    </insert>

    <update id="update">
        UPDATE users SET
            nickname = #{nickname},
            avatar_url = #{avatarUrl},
            updated_at = #{updatedAt}
        WHERE id = #{id}
    </update>
</mapper>
```

- [ ] **Step 4: 创建 Redis Session 配置**

```java
package com.nexus.user.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 7 * 24 * 60 * 60) // 7 days
public class RedisSessionConfig {

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }
}
```

- [ ] **Step 5: 创建 AuthService**

```java
package com.nexus.user.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.user.dto.LoginRequest;
import com.nexus.user.dto.RegisterRequest;
import com.nexus.user.dto.UserResponse;
import com.nexus.user.entity.User;
import com.nexus.user.mapper.UserMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserMapper userMapper) {
        this.userMapper = userMapper;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        // 检查用户名是否已存在
        if (userMapper.findByUsername(request.getUsername()) != null) {
            throw BusinessException.userAlreadyExists();
        }

        // 检查邮箱是否已存在
        if (userMapper.findByEmail(request.getEmail()) != null) {
            throw new BusinessException(1005, "邮箱已被注册");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());

        userMapper.insert(user);

        return toResponse(user);
    }

    public UserResponse login(LoginRequest request, HttpSession session) {
        User user = userMapper.findByUsername(request.getUsername());
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw BusinessException.invalidPassword();
        }

        // 存储 Session
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());

        return toResponse(user);
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    public UserResponse getCurrentUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setNickname(user.getNickname());
        response.setAvatarUrl(user.getAvatarUrl());
        return response;
    }
}
```

- [ ] **Step 6: 创建 AuthController**

```java
package com.nexus.user.controller;

import com.nexus.common.dto.ApiResponse;
import com.nexus.user.dto.LoginRequest;
import com.nexus.user.dto.RegisterRequest;
import com.nexus.user.dto.UserResponse;
import com.nexus.user.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        return ApiResponse.success(authService.login(request, session));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpSession session) {
        authService.logout(session);
        return ApiResponse.success();
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> getCurrentUser(@RequestHeader("X-User-Id") Long userId) {
        return ApiResponse.success(authService.getCurrentUser(userId));
    }
}
```

- [ ] **Step 7: 提交**

```bash
git add backend/nexus-user-service/
git commit -m "feat: add user authentication with login/register/logout"
```

---

## Part D: Workspace 服务

### Task 6: 创建 nexus-workspace-service 模块

**Files:**
- Create: `backend/nexus-workspace-service/pom.xml`
- Create: `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/NexusWorkspaceApplication.java`
- Create: `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/entity/Todo.java`
- Create: `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/entity/Activity.java`
- Create: `backend/nexus-workspace-service/src/main/resources/application.yml`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p backend/nexus-workspace-service/src/main/java/com/nexus/workspace/{controller,service,mapper,entity,config}
mkdir -p backend/nexus-workspace-service/src/main/resources/mapper
```

- [ ] **Step 2: 创建 workspace-service pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.nexus</groupId>
        <artifactId>nexus-tools</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>nexus-workspace-service</artifactId>
    <packaging>jar</packaging>

    <name>Nexus Workspace Service</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.nexus</groupId>
            <artifactId>nexus-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 3: 创建启动类**

```java
package com.nexus.workspace;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@MapperScan("com.nexus.workspace.mapper")
public class NexusWorkspaceApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexusWorkspaceApplication.class, args);
    }
}
```

- [ ] **Step 4: 创建 Todo 实体**

```java
package com.nexus.workspace.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Todo {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private Integer status;      // 0: 待办, 1: 进行中, 2: 已完成, 3: 已删除
    private Integer priority;    // 1: 低, 2: 中, 3: 高
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 5: 创建 Activity 实体**

```java
package com.nexus.workspace.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Activity {
    private Long id;
    private Long userId;
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 6: 创建 application.yml**

```yaml
server:
  port: 8082

spring:
  application:
    name: nexus-workspace-service
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
      config:
        server-addr: ${NACOS_SERVER_ADDR:localhost:8848}
        file-extension: yaml
        namespace: nexus-tools
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/nexus_workspace?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER:root}
    password: ${MYSQL_PASSWORD:root}
    driver-class-name: com.mysql.cj.jdbc.Driver
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}

mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true

logging:
  level:
    com.nexus.workspace: DEBUG
```

- [ ] **Step 7: 提交**

```bash
git add backend/nexus-workspace-service/
git commit -m "feat: add nexus-workspace-service base structure"
```

---

## Part E: Docker 配置

### Task 7: 创建 Docker 配置

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/.env.example`
- Create: `docker/gateway/Dockerfile`
- Create: `docker/user-service/Dockerfile`
- Create: `docker/workspace-service/Dockerfile`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p docker/gateway docker/user-service docker/workspace-service
```

- [ ] **Step 2: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  nexus-gateway:
    build:
      context: ../backend/nexus-gateway
      dockerfile: ../../docker/gateway/Dockerfile
    container_name: nexus-gateway
    ports:
      - "8080:8080"
    environment:
      - NACOS_SERVER_ADDR=${NACOS_ADDR}
      - REDIS_HOST=${REDIS_HOST}
      - REDIS_PORT=${REDIS_PORT}
    networks:
      - nexus-network
    depends_on:
      - nexus-user-service
      - nexus-workspace-service

  nexus-user-service:
    build:
      context: ../backend/nexus-user-service
      dockerfile: ../../docker/user-service/Dockerfile
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
      dockerfile: ../../docker/workspace-service/Dockerfile
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

- [ ] **Step 3: 创建 .env.example**

```env
# 中间件地址（请根据实际环境修改）
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

- [ ] **Step 4: 创建 gateway Dockerfile**

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/nexus-gateway-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 5: 创建 user-service Dockerfile**

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/nexus-user-service-*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 6: 创建 workspace-service Dockerfile**

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/nexus-workspace-service-*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 7: 提交**

```bash
git add docker/
git commit -m "feat: add docker compose and dockerfiles for backend services"
```

---

## Part F: Mac 应用

### Task 8: 创建 Mac 应用 Xcode 项目

**Files:**
- Create: `mac-app/NexusTools.xcodeproj/project.pbxproj` (通过 Xcode 创建)

- [ ] **Step 1: 创建 Mac 应用目录**

```bash
mkdir -p mac-app/NexusTools/{App,Models,Views,ViewModels,Services,Utils,Resources}
mkdir -p mac-app/NexusToolsTests
```

- [ ] **Step 2: 使用 Xcode 创建项目**

打开 Xcode，选择 File > New > Project，选择 macOS > App：
- Product Name: `NexusTools`
- Team: 选择你的开发者账号
- Organization Identifier: `com.nexus`
- Interface: SwiftUI
- Language: Swift
- Storage: None (手动添加 GRDB)

将项目保存到 `mac-app/` 目录。

- [ ] **Step 3: 提交**

```bash
git add mac-app/
git commit -m "feat: create mac-app xcode project skeleton"
```

---

### Task 9: 配置 GRDB.swift 依赖

**Files:**
- Modify: `mac-app/NexusTools.xcodeproj/project.pbxproj`

- [ ] **Step 1: 通过 Swift Package Manager 添加 GRDB**

在 Xcode 中：
1. File > Add Packages...
2. 输入 URL: `https://github.com/groue/GRDB.swift`
3. 选择版本: `6.24.0` 或最新稳定版本
4. Add Package

- [ ] **Step 2: 提交**

```bash
git add mac-app/
git commit -m "feat: add GRDB.swift dependency via SPM"
```

---

### Task 10: 创建本地数据库服务

**Files:**
- Create: `mac-app/NexusTools/Services/DatabaseService.swift`
- Create: `mac-app/NexusTools/Models/User.swift`
- Create: `mac-app/NexusTools/Models/AppSetting.swift`

- [ ] **Step 1: 创建 User 模型**

```swift
import GRDB

struct User: Codable, FetchableRecord, PersistableRecord {
    var id: Int64
    var username: String
    var email: String
    var sessionToken: String?
    var lastSyncAt: Date?
    var createdAt: Date
    
    static let databaseTableName = "users"
}

extension User {
    static let idKey = Column("id")
    static let usernameKey = Column("username")
    static let emailKey = Column("email")
    static let sessionTokenKey = Column("session_token")
}
```

- [ ] **Step 2: 创建 AppSetting 模型**

```swift
import GRDB

struct AppSetting: Codable, FetchableRecord, PersistableRecord {
    var key: String
    var value: String
    var updatedAt: Date
    
    static let databaseTableName = "app_settings"
}
```

- [ ] **Step 3: 创建 DatabaseService**

```swift
import GRDB
import Foundation

class DatabaseService {
    static let shared = DatabaseService()
    
    private var dbQueue: DatabaseQueue?
    
    private init() {
        setupDatabase()
    }
    
    private func setupDatabase() {
        let fileManager = FileManager.default
        let appSupportURL = try! fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        
        let dbURL = appSupportURL.appendingPathComponent("NexusTools/nexus.db")
        
        // 创建目录
        try! fileManager.createDirectory(
            at: dbURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        
        dbQueue = try! DatabaseQueue(path: dbURL.path)
        
        // 创建表
        try! dbQueue!.write { db in
            try createTables(db)
        }
    }
    
    private func createTables(_ db: Database) throws {
        // 用户表
        try db.create(table: "users", body: { t in
            t.autoIncrementedPrimaryKey("id")
            t.column("username", .text).notNull()
            t.column("email", .text).notNull()
            t.column("session_token", .text)
            t.column("last_sync_at", .datetime)
            t.column("created_at", .datetime).notNull()
        })
        
        // 同步元数据表
        try db.create(table: "sync_metadata", body: { t in
            t.column("entity_type", .text).primaryKey()
            t.column("last_sync_version", .integer)
            t.column("last_sync_at", .datetime)
        })
        
        // 应用设置表
        try db.create(table: "app_settings", body: { t in
            t.column("key", .text).primaryKey()
            t.column("value", .text).notNull()
            t.column("updated_at", .datetime).notNull()
        })
    }
    
    func getDBQueue() -> DatabaseQueue {
        return dbQueue!
    }
}
```

- [ ] **Step 4: 提交**

```bash
git add mac-app/NexusTools/Services/DatabaseService.swift
git add mac-app/NexusTools/Models/
git commit -m "feat: add local database service with GRDB"
```

---

### Task 11: 创建网络请求服务

**Files:**
- Create: `mac-app/NexusTools/Services/NetworkService.swift`

- [ ] **Step 1: 创建 NetworkService**

```swift
import Foundation

enum NetworkError: Error {
    case noConnection
    case sessionExpired
    case serverError(Int)
    case timeout
    case decodeError
}

struct ApiResponse<T: Codable>: Codable {
    let code: Int
    let message: String
    let data: T?
}

class NetworkService {
    static let shared = NetworkService()
    
    private let baseURL = "http://localhost:8080/api/v1"
    private let session: URLSession
    private var sessionCookie: String?
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
    }
    
    func setSessionCookie(_ cookie: String) {
        self.sessionCookie = cookie
    }
    
    func get<T: Codable>(path: String) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        if let cookie = sessionCookie {
            request.addValue("SESSION=\(cookie)", forHTTPHeaderField: "Cookie")
        }
        
        return await sendRequest(request)
    }
    
    func post<T: Codable, U: Codable>(path: String, body: U) async throws -> T {
        let url = URL(string: baseURL + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let cookie = sessionCookie {
            request.addValue("SESSION=\(cookie)", forHTTPHeaderField: "Cookie")
        }
        
        request.httpBody = try JSONEncoder().encode(body)
        
        return await sendRequest(request)
    }
    
    private func sendRequest<T: Codable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.noConnection
        }
        
        // 提取 Session Cookie
        if let cookies = httpResponse.value(forHTTPHeaderField: "Set-Cookie") {
            if let match = cookies.range(of: "SESSION=([^;]+)", options: .regularExpression) {
                sessionCookie = String(cookies[match].dropFirst("SESSION=".count))
            }
        }
        
        if httpResponse.statusCode == 401 {
            throw NetworkError.sessionExpired
        }
        
        if httpResponse.statusCode >= 500 {
            throw NetworkError.serverError(httpResponse.statusCode)
        }
        
        let apiResponse = try JSONDecoder().decode(ApiResponse<T>.self, from: data)
        
        if apiResponse.code != 200 {
            throw NetworkError.serverError(apiResponse.code)
        }
        
        guard let result = apiResponse.data else {
            throw NetworkError.decodeError
        }
        
        return result
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add mac-app/NexusTools/Services/NetworkService.swift
git commit -m "feat: add network service with session management"
```

---

### Task 12: 创建菜单栏管理

**Files:**
- Create: `mac-app/NexusTools/App/AppDelegate.swift`
- Modify: `mac-app/NexusTools/App/NexusToolsApp.swift`

- [ ] **Step 1: 创建 AppDelegate**

```swift
import SwiftUI
import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem?
    private var panel: NSPanel?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMenuBar()
        setupPanel()
        
        // 初始化数据库
        _ = DatabaseService.shared
        
        // 隐藏 Dock 图标
        NSApp.setActivationPolicy(.accessory)
    }
    
    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "toolbox", accessibilityDescription: "Nexus Tools")
            button.action = #selector(showPanel)
            button.target = self
        }
    }
    
    private func setupPanel() {
        panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 500),
            styleMask: [.titled, .closable, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        
        panel?.isFloatingPanel = true
        panel?.level = .floating
        panel?.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel?.contentView = NSHostingView(rootView: QuickLaunchView())
    }
    
    @objc func showPanel() {
        panel?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    func hidePanel() {
        panel?.orderOut(nil)
    }
}
```

- [ ] **Step 2: 修改 NexusToolsApp 入口**

```swift
import SwiftUI

@main
struct NexusToolsApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        // 菜单栏应用不需要 WindowGroup
        Settings {
            EmptyView()
        }
    }
}
```

- [ ] **Step 3: 提交**

```bash
git add mac-app/NexusTools/App/
git commit -m "feat: add menu bar and panel management"
```

---

### Task 13: 创建快速启动视图

**Files:**
- Create: `mac-app/NexusTools/Views/QuickLaunchView.swift`
- Create: `mac-app/NexusTools/Views/MainView.swift`

- [ ] **Step 1: 创建 QuickLaunchView**

```swift
import SwiftUI

struct QuickLaunchView: View {
    @State private var searchText = ""
    
    let tools: [ToolItem] = [
        ToolItem(name: "JSON 工具", icon: "doc.text", shortcut: "⌘J", requiresLargeWindow: false),
        ToolItem(name: "Base64", icon: "cipherkey", shortcut: "⌘B", requiresLargeWindow: false),
        ToolItem(name: "Hash 生成", icon: "hash", shortcut: "⌘H", requiresLargeWindow: false),
        ToolItem(name: "JWT 解析", icon: "key", shortcut: "⌘W", requiresLargeWindow: false),
        ToolItem(name: "待办事项", icon: "checklist", shortcut: "⌘T", requiresLargeWindow: false),
        ToolItem(name: "Markdown", icon: "doc.richtext", shortcut: "⌘M", requiresLargeWindow: true),
        ToolItem(name: "时间追踪", icon: "clock", shortcut: "⌘R", requiresLargeWindow: false),
        ToolItem(name: "统计报告", icon: "chart.bar", shortcut: "⌘S", requiresLargeWindow: true),
    ]
    
    var filteredTools: [ToolItem] {
        if searchText.isEmpty {
            return tools
        }
        return tools.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // 搜索框
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                TextField("搜索工具...", text: $searchText)
                    .textFieldStyle(.plain)
            }
            .padding(12)
            .background(Color(NSColor.controlBackgroundColor))
            
            Divider()
            
            // 工具列表
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(filteredTools) { tool in
                        ToolRow(tool: tool)
                            .background(Color.clear)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                openTool(tool)
                            }
                    }
                }
            }
            .frame(maxHeight: 400)
        }
        .frame(width: 400)
        .background(Color(NSColor.windowBackgroundColor))
    }
    
    private func openTool(_ tool: ToolItem) {
        // Phase 2 实现
        print("Opening: \(tool.name)")
    }
}

struct ToolItem: Identifiable {
    let id = UUID()
    let name: String
    let icon: String
    let shortcut: String
    let requiresLargeWindow: Bool
}

struct ToolRow: View {
    let tool: ToolItem
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: tool.icon)
                .font(.system(size: 20))
                .foregroundColor(.accentColor)
                .frame(width: 32)
            
            Text(tool.name)
                .font(.system(size: 14, weight: .medium))
            
            Spacer()
            
            Text(tool.shortcut)
                .font(.system(size: 12))
                .foregroundColor(.secondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color(NSColor.controlBackgroundColor))
                .cornerRadius(4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

#Preview {
    QuickLaunchView()
}
```

- [ ] **Step 2: 创建 MainView（占位）**

```swift
import SwiftUI

struct MainView: View {
    var body: some View {
        Text("Nexus Tools")
            .font(.largeTitle)
            .padding()
    }
}

#Preview {
    MainView()
}
```

- [ ] **Step 3: 提交**

```bash
git add mac-app/NexusTools/Views/
git commit -m "feat: add quick launch view with tool list"
```

---

## Part G: 项目配置文件

### Task 14: 创建项目配置文件

**Files:**
- Create: `CLAUDE.md`
- Create: `README.md`
- Create: `.gitignore`

- [ ] **Step 1: 创建 CLAUDE.md**

```markdown
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
```

- [ ] **Step 2: 创建 README.md**

```markdown
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
```

- [ ] **Step 3: 创建 .gitignore**

```gitignore
# macOS
.DS_Store
.AppleDouble
.LSOverride
._*

# Xcode
*.xcodeproj/project.xcworkspace/
*.xcodeproj/xcuserdata/
*.xcworkspace/xcuserdata/
build/
DerivedData/
*.ipa
*.dSYM.zip
*.dSYM

# Swift Package Manager
.build/
.swiftpm/

# Java/Maven
target/
*.jar
*.war
*.class
.settings/
.project
.classpath

# IntelliJ IDEA
.idea/
*.iml

# Docker
docker/.env

# Logs
*.log
logs/

# Environment
.env
.env.local
```

- [ ] **Step 4: 提交**

```bash
git add CLAUDE.md README.md .gitignore
git commit -m "docs: add project documentation and gitignore"
```

---

## Part H: 数据库初始化 SQL

### Task 15: 创建数据库初始化脚本

**Files:**
- Create: `docs/sql/init-user.sql`
- Create: `docs/sql/init-workspace.sql`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p docs/sql
```

- [ ] **Step 2: 创建 init-user.sql**

```sql
-- Nexus User Database Initialization
-- MySQL 9.0+

CREATE DATABASE IF NOT EXISTS nexus_user
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nexus_user;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    status TINYINT DEFAULT 1 COMMENT '1: 正常, 0: 禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 3: 创建 init-workspace.sql**

```sql
-- Nexus Workspace Database Initialization
-- MySQL 9.0+

CREATE DATABASE IF NOT EXISTS nexus_workspace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nexus_workspace;

-- 待办事项表
CREATE TABLE IF NOT EXISTS todos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status TINYINT DEFAULT 0 COMMENT '0: 待办, 1: 进行中, 2: 已完成, 3: 已删除',
    priority TINYINT DEFAULT 1 COMMENT '1: 低, 2: 中, 3: 高',
    due_date DATETIME,
    completed_at DATETIME,
    version INT DEFAULT 1 COMMENT '同步版本号',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_due_date (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 活动记录表
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) COMMENT '分类: 工作/学习/娱乐等',
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT COMMENT '持续时长(分钟)',
    notes TEXT,
    version INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_start_time (user_id, start_time),
    INDEX idx_user_category (user_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 同步版本表
CREATE TABLE IF NOT EXISTS sync_versions (
    user_id BIGINT PRIMARY KEY,
    todo_version INT DEFAULT 0,
    activity_version INT DEFAULT 0,
    last_sync_at DATETIME,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 4: 提交**

```bash
git add docs/sql/
git commit -m "feat: add database initialization scripts"
```

---

## 执行顺序总结

按以下顺序执行任务：

1. **Part A**: Task 1-2 (后端公共模块)
2. **Part B**: Task 3 (Gateway 服务)
3. **Part C**: Task 4-5 (User 服务)
4. **Part D**: Task 6 (Workspace 服务)
5. **Part E**: Task 7 (Docker 配置)
6. **Part F**: Task 8-13 (Mac 应用)
7. **Part G**: Task 14 (项目配置)
8. **Part H**: Task 15 (数据库 SQL)

每个 Part 完成后可进行阶段性测试和验证。