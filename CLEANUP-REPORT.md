# 清理副本记录

生成时间：2026-10-09 11:40:36 +08:00

## 副本范围
- 副本路径：`E:\code2\biz-reporting-system-clean`
- Git HEAD：`6c30563`，分支：`feature/analysis-year-month-contract-admin-crud`
- 保留源码、迁移、脚本、文档、规则、配置和维护模块架构目录。
- 排除 `node_modules`、dist、SQLite/DB 测试库、日志、临时表格、`.cloudrun-deploy-*`、`.research-*`、`.artifacts`、`.order-chunks`、`.workbuddy`。
- 保留当前工作区已有修改；确认删除临时脚本和不再使用的规则文档。

## GitHub 对照
- `origin`：`https://github.com/Juzongtong813/biz-reporting-system.git`。当前分支未在 origin 远端发现同名分支。
- `zy-data`：`git@github.com:Juzongtong813/zy-data.git`，同名分支为 `278da2b`；本地分支为 `6c30563`，两者从 `bd50e4a` 分叉。远端提交只涉及旧版 README 的部署链接格式，当前 README 已由本地工作区重写，因此不自动合并该提交。

## CloudBase 对照（只读）
- 当前可见环境：`zy-pro-d1g5fqh7u4cfce3ab`（NORMAL）、`zy-data-d0garirza83768686`（NORMAL）、`cloud1-8g9vn8t74a6ba79a`（ISOLATE）。
- 根目录 `cloudbaserc.json` 指向 `zy-pro` / `biz-reporting-api`；`apps/api/cloudbaserc.json` 指向 `zy-data` / `biz-reporting-api-prod`。
- 实际查询到当前选中 `zy-pro` 环境有 CloudRun `biz-reporting-api`，在线版本 `biz-reporting-api-020`，100% 流量，静态托管状态 online。
- `docs/current-deployment-status.md` 仍记录旧的 `zy-data-d2g9g1ghr47ac6254` / `biz-reporting-api-prod` 发布资料；该环境 ID 不在当前可见环境列表中，不能作为当前部署事实。
- CloudRun 查询结果包含生产密码和密钥，未复制到仓库；这些值应继续只存在 CloudBase 受控配置中。

## 验证结果
- `pnpm install --frozen-lockfile`：通过。
- `pnpm build`：通过；前端存在既有大 chunk 警告。
- `pnpm test:architecture`：通过，0 项违规。
- `pnpm release:integrity:report`：失败，原有 release-source-files.txt 引用了 59 个当前不存在的历史小程序/规则文件；需后续单独修订清单，不在本次清理中猜测删除范围。
