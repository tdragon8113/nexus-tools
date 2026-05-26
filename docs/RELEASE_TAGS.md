# 版本 Tag 与发布规则

本仓库用 **不同 tag 前缀** 区分发布物，避免推一个 tag 同时触发桌面端与服务器部署。

## Tag 对照表

| Tag 格式 | 示例 | 触发工作流 | 发布内容 |
|----------|------|------------|----------|
| `web-tools-v*` | `web-tools-v0.2.0` | [`.github/workflows/release.yml`](../.github/workflows/release.yml) | **仅** `web-tools` Electron 桌面：`NexusTools.dmg`（macOS）+ `NexusTools-setup.exe`（Windows）→ GitHub Release；DMG 另更新 Homebrew cask |
| `deploy-v*` | `deploy-v1.0.13` | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | `web-time` 静态站 + 后端镜像 → 阿里云部署 |
| `v*`（旧） | `v1.0.12` | **无** | 已弃用，请改用上表前缀 |

## 发布桌面端（web-tools）

```bash
# 1. 在 CHANGELOG.md 增加一节（版本号不含前缀）：
#    ## [0.2.0] - 2026-05-21
#    ...

git tag web-tools-v0.2.0
git push origin web-tools-v0.2.0
```

- GitHub Release 资产：
  - macOS：`NexusTools.dmg`（通用架构）
  - Windows：`NexusTools-setup.exe`（x64 NSIS 安装包）
- Release 页面 tag 名：`web-tools-v0.2.0`
- Homebrew 安装（仅 macOS）：`brew install --cask nexus-tools`（需仓库 Secret `TAP_TOKEN`）
- 本地试打包：
  - macOS：`cd web-tools && npm run desktop:dist:mac`
  - Windows：`cd web-tools && npm run desktop:dist:win`

## 发布生产环境（全栈，可选）

```bash
git tag deploy-v1.0.13
git push origin deploy-v1.0.13
```

或在 GitHub **Actions → Build and Deploy to Aliyun → Run workflow** 手动填写 tag（如 `deploy-v1.0.13`）。

## 不会随 tag 发布的内容

- `mac-app/`（Swift 旧版，已不由 CI 打包）
- 单独推 `web-tools-v*` **不会** 构建/部署 `web-time`、后端、Docker 镜像
