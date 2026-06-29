# 数据库脚本

## 清空并重建（时光记）

```bash
mysql -u root -p <<'EOF'
DROP DATABASE IF EXISTS nexus_user;
DROP DATABASE IF EXISTS nexus_workspace;
EOF

mysql -u root -p < docs/sql/init.sql
```

## 表说明

| 库 | 表 | 用途 |
|----|-----|------|
| nexus_user | users | 账号 |
| nexus_workspace | activity_categories | 活动类型配置 |
| nexus_workspace | activities | 活动记录 |
| nexus_workspace | reflections | 日/月/年感悟 |

## 默认活动类型

首次调用 `GET /api/activity-categories` 时，若用户无数据，服务端自动写入：

工作、学习、运动、社交、睡觉、休息、娱乐、其他（与 Axhub 原型一致）。

## 旧版迁移

若从含 `life_cards`、`todos`、`habits` 的旧库升级，请直接 **DROP 重建**，或自行导出需要保留的数据后再执行 `init.sql`。
