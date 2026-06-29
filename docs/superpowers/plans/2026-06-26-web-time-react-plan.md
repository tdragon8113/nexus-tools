# 时光记 web-time React + 后端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Axhub 时光记原型全量落地为 web-time（Vite React SPA）+ Java 后端 API，用户清空 DB 后通过 init.sql 重建。

**Architecture:** 纯 API 模式（JWT in localStorage）；workspace-service 负责 CRUD + ActivityAnalyticsService 服务端统计；前端 TimeJournalProvider 编排 API，页面自原型迁入。交付顺序：后端定稿 → DB → 前端分 Tab 移植。

**Tech Stack:** Vite, React 19, React Router 7, TypeScript, Java 21, Spring Boot 3.2, MyBatis, MySQL 8, nginx

**Spec:** `docs/superpowers/specs/2026-06-26-web-time-react-design.md`

---

## File Map (high level)

### Backend — create / modify

| File | Action |
|------|--------|
| `docs/sql/init.sql` | Revise per spec §4 |
| `docs/sql/README.md` | Keep |
| `backend/nexus-workspace-service/.../ActivityAnalyticsService.java` | Create |
| `backend/nexus-workspace-service/.../ActivitySummaryService.java` | Create |
| `backend/nexus-workspace-service/.../dto/response/ActivityAnalyticsResponse.java` | Create |
| `backend/nexus-workspace-service/.../dto/response/ActivitySummaryResponse.java` | Create |
| `backend/nexus-workspace-service/.../controller/ActivityController.java` | Add analytics, summary, date filter |
| `backend/nexus-workspace-service/src/test/.../ActivityAnalyticsServiceTest.java` | Create |
| `backend/nexus-gateway/src/main/resources/application.yml` | Routes (no life-cards) |

### Frontend — create (after removing Nuxt)

| File | Action |
|------|--------|
| `web-time/package.json` | Replace deps |
| `web-time/vite.config.ts` | base + proxy |
| `web-time/src/main.tsx` | Entry |
| `web-time/src/app/App.tsx` | Router + Provider |
| `web-time/src/app/AppLayout.tsx` | Shell + TabBar |
| `web-time/src/app/routes.tsx` | Route table |
| `web-time/src/api/client.ts` | fetch + refresh |
| `web-time/src/styles/style.css` | Copy from prototype |

---

## Task 1: 后端 — ActivityAnalyticsService（TDD）

**Files:**
- Create: `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/application/service/ActivityAnalyticsService.java`
- Create: `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/application/support/StatsDateUtils.java`
- Create: `backend/nexus-workspace-service/src/test/java/com/nexus/workspace/application/service/ActivityAnalyticsServiceTest.java`
- Create: `backend/nexus-workspace-service/src/main/java/com/nexus/workspace/interfaces/dto/response/ActivityAnalyticsResponse.java`

- [ ] **Step 1: Write failing test — week preset metrics**

```java
@Test
void weekPreset_excludesSleep_filtersSleepCategory() {
    Long userId = 1L;
    LocalDateTime now = LocalDateTime.of(2026, 6, 26, 12, 0);
    List<Activity> activities = List.of(
        activity(userId, "work", "工作", 60, LocalDateTime.of(2026, 6, 25, 9, 0)),
        activity(userId, "sleep", "睡觉", 480, LocalDateTime.of(2026, 6, 25, 23, 0))
    );
    ActivityAnalyticsService service = new ActivityAnalyticsService(new InMemoryActivityRepo(activities));

    ActivityAnalyticsResponse res = service.analyze(userId, "week", null, null, true, now);

    assertThat(res.getMetrics().getTotalMinutes()).isEqualTo(60);
}
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd backend && mvn -q test -pl nexus-workspace-service -Dtest=ActivityAnalyticsServiceTest`
Expected: compilation failure (class not found)

- [ ] **Step 3: Implement StatsDateUtils + minimal ActivityAnalyticsService**

Port from prototype `data.ts`:
- `getStatsRangeBounds(preset, customStart, customEnd, now)`
- `getPeriodMetrics(activities, categories, startKey, endKey)`
- `filterActivitiesForStats(activities, excludeSleep)`
- `getActivityAttributionDateKey` (sleep 6am rollover)

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Add tests for streak, changePercent, custom range; run full test class**

---

## Task 2: 后端 — analytics + summary HTTP 端点

**Files:**
- Modify: `backend/nexus-workspace-service/.../controller/ActivityController.java`
- Create: `backend/nexus-workspace-service/.../dto/response/ActivitySummaryResponse.java`
- Create: `backend/nexus-workspace-service/.../application/service/ActivitySummaryService.java`
- Modify: `backend/nexus-workspace-service/.../mapper/ActivityMapper.java` + `ActivityMapper.xml` (date filter)

- [ ] **Step 1: Add GET `/activities/analytics`**

Query params: `preset`, `customStartKey`, `customEndKey`, `excludeSleep`

- [ ] **Step 2: Add GET `/activities/summary`**

Returns: totalXp, level, levelProgress, recordDays, streak

Level thresholds — copy from prototype `data.ts` `LEVEL_THRESHOLDS` into Java constant class `LevelThresholds.java`.

- [ ] **Step 3: Add GET `/activities?from=&to=` date filter on list endpoint**

- [ ] **Step 4: Manual smoke via gateway**

```bash
# login
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"123456"}'
# use token
curl -s 'http://localhost:8080/api/activities/analytics?preset=week' \
  -H "Authorization: Bearer $TOKEN"
```

Expected: JSON with bounds, metrics, chartBuckets

- [ ] **Step 5: Mark GET `/activities/stats` @Deprecated in controller Javadoc**

---

## Task 3: 后端 — 修订草案 CRUD（对齐 spec）

**Files:**
- Verify: `docs/sql/init.sql`, Activity/Category/Reflection controllers
- Remove or @Deprecated: `LifeCardController.java`

- [ ] **Step 1: Diff draft vs spec §5 — fix gaps**

Ensure: mood/xp on Activity DTOs; backfill only blocks ongoing when endTime null; change password endpoint exists.

- [ ] **Step 2: Run full backend compile**

Run: `cd backend && mvn -q compile`
Expected: BUILD SUCCESS

---

## Task 4: 数据库初始化（用户操作 + 文档）

**Files:**
- `docs/sql/init.sql`
- `docs/sql/README.md`

- [ ] **Step 1: User runs DROP + init.sql** (see README)

- [ ] **Step 2: Verify tables**

```sql
USE nexus_workspace;
SHOW TABLES;
-- expect: activity_categories, activities, reflections, ...
```

---

## Task 5: 前端脚手架 — 清除 Nuxt，建立 Vite

**Files:**
- Delete: `web-time/app/`, `web-time/nuxt.config.ts`, `web-time/.nuxt/`, `web-time/tailwind.config.js`
- Create: `web-time/vite.config.ts`, `web-time/index.html`, `web-time/src/main.tsx`
- Replace: `web-time/package.json`

- [ ] **Step 1: Backup then remove Nuxt source**

```bash
rm -rf web-time/app web-time/nuxt.config.ts web-time/tailwind.config.js
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "nexus-web-time",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 3001",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 3001",
    "test": "vitest run"
  },
  "dependencies": {
    "lucide-react": "^0.525.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.3"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/manage/time/',
  server: {
    port: 3001,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
```

- [ ] **Step 4: Create index.html with title 时光记**

- [ ] **Step 5: npm ci && npm run dev — verify empty shell at http://localhost:3001/manage/time/**

---

## Task 6: 迁入 style.css + AppLayout

**Files:**
- Copy: `Axhub原型设计/src/prototypes/time-journal/style.css` → `web-time/src/styles/style.css`
- Create: `web-time/src/app/AppLayout.tsx`

- [ ] **Step 1: Copy style.css**

- [ ] **Step 2: AppLayout with .tj-shell / .tj-phone / TabBar (from prototype index.tsx lines 377-413)**

- [ ] **Step 3: Visual check — tab bar renders, forest-green theme**

---

## Task 7: API client + auth

**Files:**
- Create: `web-time/src/api/client.ts`
- Create: `web-time/src/api/auth.ts`
- Create: `web-time/src/auth/tokenStorage.ts`

- [ ] **Step 1: tokenStorage**

```typescript
const ACCESS = 'tj.accessToken'
const REFRESH = 'tj.refreshToken'
export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS, access)
    localStorage.setItem(REFRESH, refresh)
  },
  clear: () => { localStorage.removeItem(ACCESS); localStorage.removeItem(REFRESH) },
}
```

- [ ] **Step 2: client.ts — fetch wrapper, 401 → refresh → retry once**

- [ ] **Step 3: auth.ts — login, register, logout, me, changePassword**

- [ ] **Step 4: Vitest test for tokenStorage round-trip**

---

## Task 8: TimeJournalProvider + mappers

**Files:**
- Create: `web-time/src/api/mappers.ts`
- Create: `web-time/src/hooks/TimeJournalProvider.tsx`
- Create: `web-time/src/domain/level.ts`

- [ ] **Step 1: mappers — ActivityResponse id number → string UI model**

- [ ] **Step 2: Provider loads categories, activities, reflections, ongoing, summary on login**

- [ ] **Step 3: Expose mutations: saveActivity, updateActivity, upsertReflection, category CRUD**

---

## Task 9: RecordPage 移植

**Files:**
- Copy/adapt: `Axhub原型设计/.../RecordPage.tsx` → `web-time/src/pages/RecordPage.tsx`
- Remove: overlap logic stays client-side; POST/PATCH call Provider

- [ ] **Step 1: Port UI + live timer + backfill mode switch**

- [ ] **Step 2: Wire create → POST /activities; end → PATCH with endTime**

- [ ] **Step 3: Wire ongoing → GET /activities/ongoing on mount**

- [ ] **Step 4: Manual test — record 5min activity, verify MySQL row**

---

## Task 10: HomePage 移植

**Files:**
- Copy/adapt: `HomePage.tsx`
- Use: summary + analytics?preset=today + activities?from=today

- [ ] **Step 1: Port XP bar (summary.level / levelProgress)**

- [ ] **Step 2: Port today timeline from filtered activities**

- [ ] **Step 3: Port day reflection upsert → PUT /reflections**

---

## Task 11: StatsPage 移植

**Files:**
- Copy: `stats/statsUnifiedView.tsx`, `stats/statsRangeToolbar.tsx`, `stats/statsShared.tsx` (strip useStatsViewProps aggregation)
- Create: `web-time/src/hooks/useAnalytics.ts`

- [ ] **Step 1: useAnalytics calls GET /activities/analytics with preset + excludeSleep**

- [ ] **Step 2: StatsPage passes API response to StatsUnifiedView**

- [ ] **Step 3: Compare visually with Axhub prototype side-by-side**

---

## Task 12: Profile 子页 + ActivityDetail

**Files:**
- Port: ProfilePage, CategoryManagePage, HelpPage, AccountManagePage, ChangePasswordPage, ProfileArchivePage, ActivityDetailPage
- Port: components (DatePicker, RichNoteEditor, …)

- [ ] **Step 1: Profile auth section → real login/register (email optional field)**

- [ ] **Step 2: CategoryManage → categories API**

- [ ] **Step 3: ChangePassword → PATCH /auth/password**

- [ ] **Step 4: Archive pages → filter local activities/reflections lists**

- [ ] **Step 5: ActivityDetail → PATCH notes**

---

## Task 13: 部署适配

**Files:**
- Modify: `web-time/Dockerfile`
- Modify: `web-time/nginx.conf`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Dockerfile COPY dist/ instead of .output/public**

```dockerfile
COPY dist /usr/share/nginx/html
RUN test -f /usr/share/nginx/html/index.html \
  && grep -q '时光记' /usr/share/nginx/html/index.html
```

- [ ] **Step 2: nginx — remove /_nuxt/, try_files → /manage/time/index.html**

- [ ] **Step 3: deploy.yml — build dist/, update grep**

- [ ] **Step 4: npm run build locally — verify**

---

## Spec Coverage Checklist

| Spec § | Task |
|--------|------|
| §4 DB schema | Task 3, 4 |
| §5.1 Auth | Task 3, 7, 12 |
| §5.2 Activities + date filter | Task 2, 3, 9 |
| §5.3 Categories | Task 3, 8, 12 |
| §5.4 Reflections | Task 3, 8, 10, 12 |
| §5.5 Analytics | Task 1, 2, 11 |
| §5.6 Summary | Task 2, 10 |
| §6 Frontend structure | Task 5–12 |
| §7 Deploy | Task 13 |
| §8 Tests | Task 1, 7 |
| §9 Phases P0–P8 | Tasks 1–13 order |

---

## Execution Handoff

Plan saved. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks

**2. Inline Execution** — execute tasks in this session with checkpoints

Which approach?
