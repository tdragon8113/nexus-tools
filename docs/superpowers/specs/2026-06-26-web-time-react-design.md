# 时光记 web-time React + 后端 — 设计规格

日期：2026-06-26  
状态：**已确认**（头脑风暴 §1–§4 用户批准）

---

## 1. 目标

将 Axhub「时光记」原型全量落地为生产应用：

- **web-time**：Vite + React + React Router SPA，替换现有 Nuxt/Vue
- **后端**：扩展现有 Java 微服务（user + workspace），重建 MySQL schema
- **数据**：纯 API；localStorage 仅存 JWT

---

## 2. 已确认决策

| 项 | 选择 |
|----|------|
| 前端栈 | Vite + React + React Router |
| 路由 | BrowserRouter，`base: /manage/time/` |
| 范围 | 全量移植原型（4 Tab + 全部 Profile 子页） |
| 数据同步 | 纯 API；token 存 localStorage |
| 认证 UX | 登录用账户名；注册 email **可选** |
| 统计 | **服务端** `/activities/analytics` |
| 重叠校验 | **仅前端** warn + 确认 |
| 交付顺序 | **方案 B**：后端定稿 → DB → 前端移植 |
| 数据库 | 用户清空后执行 `docs/sql/init.sql` |

---

## 3. 整体架构

```mermaid
flowchart TB
  subgraph client [web-time SPA]
    UI[Pages / Components]
    Ctx[TimeJournalProvider]
    API[api client + mappers]
    UI --> Ctx --> API
  end

  subgraph gateway [nexus-gateway :8080]
    JWT[JwtAuthFilter]
  end

  subgraph user_svc [nexus-user-service]
    Auth[/api/auth/*]
  end

  subgraph ws_svc [nexus-workspace-service]
    Act[/api/activities/*]
    Cat[/api/activity-categories/*]
    Ref[/api/reflections/*]
    Ana[/api/activities/analytics]
    Sum[/api/activities/summary]
  end

  API --> JWT --> Auth
  API --> JWT --> Act
  API --> JWT --> Cat
  API --> JWT --> Ref
  API --> JWT --> Ana
  API --> JWT --> Sum

  subgraph db [MySQL]
    NU[(nexus_user)]
    NW[(nexus_workspace)]
  end

  user_svc --> NU
  ws_svc --> NW
```

### 边界

| 层 | 职责 |
|----|------|
| 前端 `domain/` | 等级展示公式、日期格式化、富文本 sanitize |
| 前端 `api/` | HTTP、DTO 映射、token 刷新 |
| 后端 workspace | 持久化、analytics 聚合、分类/感悟 CRUD |
| localStorage | `accessToken`、`refreshToken`  only |

### 草案后端说明

会话中曾提前编写部分后端/SQL，视为**待按本 spec 修订的草稿**。实施前须补齐：`/analytics`、`/summary`、activities 日期过滤；废弃 `life_cards` 与 `/api/life-cards/**`。

---

## 4. 数据库

执行：`docs/sql/README.md`（DROP 两库 → `init.sql`）

### nexus_user.users

不变。`username`、`email` 均 UNIQUE。注册未填 email 时生成 `{username}@timejournal.local`。

### nexus_workspace.activity_categories

| 列 | 说明 |
|----|------|
| user_id + slug | UNIQUE，如 `work` |
| label, emoji | 展示 |
| xp_per_hour | XP 换算 |
| sort_order | 排序 |

### nexus_workspace.activities

| 列 | 说明 |
|----|------|
| category | slug |
| start_time, end_time | end NULL = 进行中 |
| duration_minutes, mood (1–5), xp | 时光记字段 |
| notes | 富文本 |

### nexus_workspace.reflections

| 列 | 说明 |
|----|------|
| scope | day / month / year |
| period_key | `YYYY-MM-DD` / `YYYY-MM` / `YYYY` |
| content | TEXT |

### 移除

- `life_cards`、`life_card_children`
- `todos`、`habits`、`habit_checkins`、`sync_metadata`（非时光记；后端 API 已删除）

### 统计日切

睡觉类活动按 **06:00** 归因到日历日（移植原型 `getActivityAttributionDateKey`）。

---

## 5. API 契约

### 5.1 认证 — nexus-user-service

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | `{ username, password, email?, nickname? }` |
| POST | `/api/auth/login` | `{ username, password }` → tokens + user |
| POST | `/api/auth/refresh` | token 轮换 |
| POST | `/api/auth/logout` | revoke refresh |
| GET | `/api/auth/me` | 当前用户 |
| PATCH | `/api/auth/me` | `{ nickname }` |
| PATCH | `/api/auth/password` | 改密后 revoke 全部 refresh |
| DELETE | `/api/auth/account` | 注销 |

**UserResponse → UI AuthUser**

- `displayName` ← `nickname ?? username`
- `avatarColor` ← username hash（前端生成，与原型一致）

### 5.2 活动 — nexus-workspace-service

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/activities` | 全量，start_time DESC |
| GET | `/api/activities?from=&to=` | 按**归因日期**过滤 |
| POST | `/api/activities` | 创建；`endTime=null` 为进行中；**仅此时**检查进行中冲突 → 409 |
| GET | `/api/activities/ongoing` | 当前进行中 |
| PATCH | `/api/activities/{id}` | 更新 title/category/end/duration/mood/xp/notes |
| DELETE | `/api/activities/{id}` | 删除 |

**ActivityResponse 字段**：id, title, category, startTime, endTime, durationMinutes, mood, xp, notes, createdAt

**重叠**：后端不校验；前端保留 warn + 用户确认。

### 5.3 活动类型

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/activity-categories` | 首次空表 auto seed 8 类 |
| POST | `/api/activity-categories` | `{ id(slug), label, emoji, xpPerHour }` |
| PATCH | `/api/activity-categories/{slug}` | 更新 |
| DELETE | `/api/activity-categories/{slug}` | 有活动引用 → 400 |
| POST | `/api/activity-categories/reset-defaults` | 恢复默认 |

默认 8 类：工作、学习、运动、社交、睡觉、休息、娱乐、其他（与原型一致）。

### 5.4 感悟

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reflections` | 全量 |
| PUT | `/api/reflections` | upsert `{ scope, periodKey, content }` |
| DELETE | `/api/reflections/{id}` | 删除 |

### 5.5 统计 — GET `/api/activities/analytics`

**Query**

| 参数 | 值 |
|------|-----|
| preset | today, yesterday, week, 7d, 30d, month, custom |
| customStartKey, customEndKey | preset=custom 时必填 |
| excludeSleep | true / false，默认 false |

**Response**（前端直接渲染，对齐原型 `useStatsViewProps`）

- bounds, metrics, previousMetrics
- totalChange, avgChange, xpChange
- categoryBreakdown[], chartBuckets[], dayMarkers[]
- streak, insight, moodLabel, rangeLabel

**实现**：Java `ActivityAnalyticsService`，移植原型 `data.ts` 中 stats 聚合函数。

**废弃**：`GET /api/activities/stats`（基础聚合），MVP 后删除。

### 5.6 首页摘要 — GET `/api/activities/summary`

```json
{
  "totalXp": 1250,
  "level": 5,
  "levelProgress": 0.62,
  "recordDays": 42,
  "streak": 5
}
```

等级公式与原型一致（前端 `domain/level.ts` 与服务端共用同一套阈值常量，服务端为权威来源）。

### 5.7 网关路由

workspace 路由包含：

`/api/activities/**`, `/api/activity-categories/**`, `/api/reflections/**`

移除 `/api/life-cards/**`。

---

## 6. 前端结构

```
web-time/src/
  app/           App, AppLayout, routes
  pages/         Home, Record, Stats, ActivityDetail, profile/*
  components/    DatePicker, RichNoteEditor, …
  api/           client, auth, activities, categories, reflections, analytics, mappers
  hooks/         useTimeJournal, useAnalytics
  domain/        level, dates, noteRichText
  auth/          tokenStorage
  styles/        style.css
```

**不移植**：useHashPage, profileVariants, statsVariants, statsExploreControls, Axhub annotation。

### 6.1 路由

| 路径 | 页面 |
|------|------|
| `/` | Home |
| `/record` | Record |
| `/stats` | Stats |
| `/profile` | Profile |
| `/activity/:id` | ActivityDetail |
| `/profile/categories` | CategoryManage |
| `/profile/help` | Help |
| `/profile/account` | AccountManage |
| `/profile/change-password` | ChangePassword |
| `/profile/record-days` | Archive(record-days) |
| `/profile/activities` | Archive(activities) |
| `/profile/reflections` | Archive(reflections) |
| `/profile/month-summaries` | Archive(month) |
| `/profile/year-summaries` | Archive(year) |

Tab 高亮规则与原型一致（Profile 子路由 → Profile 激活；activity-detail → Home 激活）。

Home / Record 页面保活（CSS host 隐藏，不 unmount）。

### 6.2 TimeJournalProvider

| 数据 | API | 刷新 |
|------|-----|------|
| categories | GET /activity-categories | 登录、CRUD 后 |
| activities | GET /activities | 登录、保存后 |
| reflections | GET /reflections | 登录、保存后 |
| ongoing | GET /activities/ongoing | 开始/结束记录 |
| summary | GET /activities/summary | 首页 mount、记录后 |

未登录：Home/Record/Stats 显示登录引导；Profile 展示登录/注册。

**ID**：API Long ↔ UI string，经 `mappers.ts` 统一。

### 6.3 页面 API 对照

| 页面 | API |
|------|-----|
| Home | summary, analytics?preset=today, activities?from=today, reflections, ongoing |
| Record | POST/PATCH activities, ongoing |
| Stats | GET /analytics（preset / excludeSleep 变化 refetch） |
| ActivityDetail | PATCH activity |
| Profile | auth/me, summary |
| CategoryManage | categories CRUD |
| ProfileArchive | activities / reflections 过滤 |
| ChangePassword | PATCH /auth/password |

StatsPage：移除客户端 `useStatsViewProps` 聚合，改用 `useAnalytics`。

### 6.4 错误处理

| 场景 | 行为 |
|------|------|
| 401 | refresh → 失败则清 token，引导登录 |
| 409 进行中 | Record 页提示 |
| 400 | 展示后端 message |
| 网络错误 | banner + 重试 |

---

## 7. 部署

| 项 | 配置 |
|----|------|
| base | `/manage/time/` |
| 构建 | `npm run build` → `dist/` |
| nginx | SPA fallback → `/manage/time/index.html` |
| dev | port 3001，`/api` proxy → gateway:8080 |
| CI | 校验 `dist/index.html` 含「时光记」 |
| 产品标题 | **时光记**（页面 title / CI grep） |

---

## 8. 测试

| 层 | 内容 |
|----|------|
| 后端 | `ActivityAnalyticsServiceTest`：日切、excludeSleep、环比、streak |
| 前端 | Vitest：mappers、level、noteRichText |
| E2E | MVP 手工走查；不自动化 |

---

## 9. 实施顺序（方案 B）

| 阶段 | 交付 | 验收 |
|------|------|------|
| P0 | 后端定稿：analytics + summary + 日期过滤 | mvn test |
| P1 | 用户执行 init.sql | 表正确 |
| P2 | 清 Nuxt，Vite 脚手架 + Shell + style.css | dev 可开 |
| P3 | 认证 + Provider | 可登录拉 categories |
| P4 | Record Tab | DB 有记录 |
| P5 | Home Tab | 等级/时间线 |
| P6 | Stats Tab | 对接 analytics |
| P7 | Profile 全子页 | 全路由通 |
| P8 | Dockerfile / nginx / CI | deploy 绿 |

---

## 10. 不在范围

- PWA / 离线缓存
- life_cards 旧 API
- statsVariants / profileVariants 探索 UI
- 后端重叠时段强制拦截
- E2E 自动化
