# 经营数据中台

经营数据中台用于汇总和管理合同、订单、完工、成本等经营数据，并为管理人员与地市用户提供业务工作台、统计分析和数据导出。

系统采用 pnpm workspace 单仓库：后端为 NestJS + TypeORM，管理端为 React + Vite，数据存储使用 MySQL；仓库还包含共享 TypeScript 类型、数据库迁移、测试脚本和 CloudBase CloudRun 部署配置。

## 功能概览

- **经营管理**：合同台账、合同导入和维护、费率、订单、线下完工、成本与经营汇总。
- **数据分析**：经营概览、月度趋势、地市对比及合同预警。统计页面使用后端生成的快照；管理员可以通过“更新数据”触发当日快照重算。
- **地市工作台**：地市用户在授权的数据范围内查看和维护数据、提交月度上报。
- **权限与审计**：按角色、功能权限和数据范围控制访问，记录关键操作并提供受控导出。
- **后台维护**：用户与地市配置、导入任务、通知、操作日志和数据维护。

## 仓库结构

```text
apps/
  api/                 NestJS API、TypeORM 实体、SQL 迁移与测试
  admin-web/           React 管理端和地市工作台
packages/
  shared-types/        前后端共享 DTO 与类型
  shared-constants/    共享常量
scripts/
  db/                  数据库迁移工具与迁移校验
  test/                单元测试及项目验证脚本
docs/                  使用手册、部署说明、迁移与设计资料
```

## 环境要求

- Node.js 18 或更新版本
- pnpm 9（仓库声明版本为 `9.15.0`）
- MySQL 兼容数据库；开发机需要可用的 MySQL 实例和独立开发库

安装依赖：

```bash
pnpm install
```

## 本地开发

1. 复制 `apps/api/.env.example` 为 `apps/api/.env.local`，填写本地数据库连接信息和随机生成的 `JWT_SECRET`、`AUTH_SECURITY_HMAC_KEY`。这两个密钥必须不同；不要将真实凭据提交到仓库。
2. 确认 `.env.local` 中 `DB_DATABASE` 指向本地开发库，且 `DB_SYNC=false`。数据库结构通过迁移管理，不要把生产数据库用于本地测试。
3. 分别启动 API 和管理端：

```bash
pnpm dev:api
pnpm dev:admin
```

默认 API 地址为 `http://localhost:3000`，统一前缀为 `/api`；管理端 Vite 开发服务器默认使用 `http://localhost:5174`，并将 `/api` 请求代理到 API。开发环境 Swagger 文档位于 `http://localhost:3000/api/docs`。

若 API 不在本机，可在启动前设置 `VITE_DEV_API_TARGET` 指向开发 API 地址。只有本地开发时才可启用模拟接口：`VITE_ENABLE_MSW=true`；不要在生产构建中启用。

## 数据库迁移

迁移 SQL 位于 `apps/api/migration/`，迁移账本和校验工具位于 `scripts/db/`。运行迁移前，应确认当前环境变量指向目标数据库，并先检查迁移状态：

```bash
pnpm db:migrate:status
pnpm db:migrate:precheck
pnpm db:migrate
```

校验迁移文件与 checksum：

```bash
pnpm migration-files:check
pnpm test:migrations:ledger
```

生产环境必须设置 `DB_SYNC=false`，通过审核过的迁移变更维护 schema。迁移会改变数据库结构；不要把本地迁移命令直接指向生产库，也不要修改已发布迁移文件，应追加新的迁移。

## 构建与检查

```bash
# 全仓构建
pnpm build

# 类型检查
pnpm typecheck
pnpm --filter @biz-reporting/api typecheck
pnpm --filter @biz-reporting/admin-web typecheck

# 单元测试
pnpm test:unit

# 常用专项检查
pnpm test:architecture
pnpm test:deployment-preflight
pnpm test:hosting-bundle
```

部分 MySQL 集成测试、真实账号流程和浏览器测试需要配置隔离测试环境或测试凭据；运行前请查看相应脚本说明。不要将线上用户 token 或生产凭据用于自动化测试。

## 部署

后端为 Docker 容器，可通过根目录 `Dockerfile` 和 `cloudbaserc.json` 部署至 CloudBase CloudRun。容器读取 CloudRun 注入的 `PORT`，生产数据库与认证配置必须通过受控环境变量注入，不能写入镜像或提交到 Git。

管理端是 Vite 静态站点。构建命令为：

```bash
pnpm --filter @biz-reporting/admin-web build
```

生产构建可通过 `VITE_API_BASE_URL` 指定 API 基址；未设置时前端默认请求同源 `/api`。部署前请核对 CloudBase 环境 ID、CloudRun 服务名、数据库连接、访问域名和 CORS origin，并按部署手册完成检查。生产发布通过 CloudBase MCP / 本项目约定流程进行，避免直接运行未经核对的通用部署命令。

## 重要约定

- 生产配置、数据库 schema、运行状态会随发布变化；README 仅描述仓库当前实现和通用流程，不作为生产资源清单。
- 不要提交 `.env.local`、密码、JWT/HMAC 密钥、访问令牌、用户数据或真实业务表格。
- 前后端共享 API 类型放在 `packages/shared-types`；数据库结构变化应包含迁移及对应校验。
- 统计数据更新由后端快照任务完成。手动刷新会重算当前业务日；自动任务对已完成日期保持幂等。

## 文档

- [地市用户使用手册](docs/用户端使用手册-精简版.md)
- [部署指南](docs/deployment-guide.md)
- [当前部署状态记录](docs/current-deployment-status.md)（发布状态资料，可能需要结合最近部署更新）
- [迁移与数据血缘运行手册](docs/v3.1-migration-lineage-runbook.md)
- [RBAC、认证与导出需求](specs/rbac-auth-export-settings/requirements.md)
- [RBAC、认证与导出设计](specs/rbac-auth-export-settings/design.md)
- [接口权限矩阵](specs/rbac-auth-export-settings/endpoint-permission-matrix.md)
