# 数据库脚本

## 库名约定

| 环境 | 用户库 | 业务库 |
|------|--------|--------|
| 生产 | `nexus_user` | `nexus_workspace` |
| 本地 | `nexus_user_local` | `nexus_workspace_local` |

本地与生产可共用同一 MySQL 实例，通过库名后缀 `_local` 隔离。

后端通过环境变量 `MYSQL_DATABASE_SUFFIX` 切换：

- 生产（默认）：不设置或留空 → `nexus_user`、`nexus_workspace`
- 本地：`_local` → `nexus_user_local`、`nexus_workspace_local`

## 本地开发（推荐）

**1. 初始化本地库（不影响生产库）**

```bash
mysql -u root -p < docs/sql/init-local.sql
```

如需清空本地库后重建：

```bash
mysql -u root -p <<'EOF'
DROP DATABASE IF EXISTS nexus_user_local;
DROP DATABASE IF EXISTS nexus_workspace_local;
EOF

mysql -u root -p < docs/sql/init-local.sql
```

**2. 在 `.env` 中配置**

```bash
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=你的密码
MYSQL_DATABASE_SUFFIX=_local
```

**3. 启动后端**

```bash
set -a && source .env && set +a
cd backend && mvn spring-boot:run -pl nexus-user-service -am   # 另开终端跑 gateway、workspace
```

## 生产 / 全量重建

```bash
mysql -u root -p <<'EOF'
DROP DATABASE IF EXISTS nexus_user;
DROP DATABASE IF EXISTS nexus_workspace;
EOF

mysql -u root -p < docs/sql/init.sql
```

生产部署 **不要** 设置 `MYSQL_DATABASE_SUFFIX`。

## 表说明

| 库 | 表 | 用途 |
|----|-----|------|
| nexus_user / nexus_user_local | users | 账号 |
| nexus_workspace / nexus_workspace_local | activity_categories | 活动类型配置 |
| nexus_workspace / nexus_workspace_local | activities | 活动记录 |
| nexus_workspace / nexus_workspace_local | reflections | 日/月/年感悟 |

## 默认活动类型

首次调用 `GET /api/activity-categories` 时，若用户无数据，服务端自动写入：

工作、学习、运动、社交、睡觉、休息、娱乐、其他（与 Axhub 原型一致）。

## 旧版迁移

若从含 `life_cards`、`todos`、`habits` 的旧库升级，请直接 **DROP 重建**，或自行导出需要保留的数据后再执行对应 init 脚本。
