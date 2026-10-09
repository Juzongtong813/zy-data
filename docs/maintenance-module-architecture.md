# 维护管理模块架构设计（首期）

## 1. 目标与边界

维护管理是独立的新业务域，首期管理人员、车辆、油机三类档案，提供增删改查、PDF 文件归档、PDF 内容识别辅助录入及业务计算。复用现有前端的登录态、`BizLayout` 视觉规范、Ant Design 组件和 API 请求封装；不复用经营管理的合同、订单、成本、报表行或聚合业务表/API。维护入口沿用现有模块和权限种子，不新建一套权限模型。

计算口径（例如车辆/油机指标、人员资质统计、跨实体汇总）需由业务规则确定。架构将计算实现放在独立领域服务中，输入输出显式版本化，避免公式散落到页面或 CRUD 服务。

## 2. 总体结构

```text
React Admin Web（统一 BizLayout 风格）
  ├─ 人员档案 / 车辆档案 / 油机档案
  ├─ PDF 导入与识别确认
  └─ 计算结果 / 识别任务状态
          │ /api/biz/maintenance/*
          ▼
NestJS maintenance domain
  ├─ Personnel / Vehicle / Generator CRUD services
  ├─ Calculation service（纯领域规则、可测试）
  ├─ Document service（元数据、授权预览/下载）
  └─ PDF recognition orchestration（任务、结果、人工确认）
          ├─ MySQL：业务档案、文档元数据、识别任务、审计记录
          ├─ Object storage adapter：原始 PDF（私有桶）
          └─ PDF extraction adapter：文本抽取/OCR，可替换
```

首期可在现有 NestJS 应用内按独立模块实现，不必立即拆微服务；通过 StorageProvider、PdfRecognitionProvider 接口保持外部实现可替换。PDF 处理异步化，避免浏览器上传请求受解析耗时影响。

## 3. 前端结构与统一方式

在 `apps/admin-web/src/pages/biz/maintenance/` 建立独立页面和组件：

- `MaintenanceHome`：维护管理首页及三类入口/概览。
- `PersonnelList`、`VehicleList`、`GeneratorList`：查询筛选、分页、详情、创建/编辑、停用/删除、文档和导入入口。
- 共用 `RecordFormDrawer`、`PdfImportPanel`、`RecognitionReview`、`CalculationPanel`。
- API 单独放 `src/api/maintenance.api.ts`；前端 DTO 从 shared-types 导入。

继续使用现有 Ant Design 表格、筛选卡片、抽屉表单、页面头、统一空态与消息提示、响应式侧栏，不引入第二套 UI 框架。路由与菜单融入现有登录后的布局，不另建一套前端应用。

## 4. 后端模块与主要职责

建议新增 `apps/api/src/maintenance/`：

- `maintenance.module.ts`：聚合模块注册。
- `personnel.controller/service/entity`：人员档案 CRUD 和人员维度计算查询。
- `vehicles.controller/service/entity`：车辆档案 CRUD 和车辆计算。
- `generators.controller/service/entity`：油机档案 CRUD 和油机计算。
- `maintenance-documents.*`：PDF 元数据与上传、预览/下载、软删除。
- `pdf-recognition.*`：解析任务提交、处理、状态查询、结果确认/驳回。
- `maintenance-calculation.service.ts`：业务公式与版本标识，输入验证、舍入规则、单位。
- DTO 使用 `class-validator`；列表接口支持分页、关键词、状态和业务筛选。

## 5. 字段与数据模型

业务字段以字段表为准，字段表至少要能映射到页面显示字段、shared-types 字段、DTO 校验字段和数据库列。唯一范围、枚举值、敏感级别、识别回填策略和组织归属必须逐项落地；未在字段表中定义的字段不得由实现人员自行添加。

汇总表的结构基线为 3 张对象明细表：人员 A:AF（32 列）、车辆 A:U（21 列）、油机 A:R（18 列），另有 1 张合并说明页。三张明细表都以序号开头，并按“省级组织、公司/分公司、地市/区域”三级组织字段分层，后接对象字段。架构上应把组织归属抽成统一的 `org_province`、`org_company`、`org_region` 逻辑字段，再映射到现有组织模型，避免三个实体各自定义一套组织列。

表格结构只用于确定字段分组，不代表数据库列名或最终接口形状。人员的资质/证件和保险类信息、车辆的保险与登记信息、油机的规格与运行信息，应分别建成结构化字段或子表；同类证件和保单不能依赖带“#2/#3”后缀的重复列表达。

主键建议 UUID（`VARCHAR(36)`），创建/更新时间、创建人/更新人、状态、乐观锁版本号；删除优先软删除并审计。

| 表 | 职责 / 主要字段 |
|---|---|
| `maintenance_personnel` | 人员档案：人员身份、岗位/用工、联系方式、组织归属、资质证件及有效期、保险/保障信息；敏感字段按字段表脱敏 |
| `maintenance_vehicles` | 车辆档案：车牌/车辆标识、类型与用途、驾驶人联系方式、登记/里程、品牌型号、燃料类型、所有权、状态及保险期限 |
| `maintenance_generators` | 油机档案：油机编号、联系人、规格型号、额定功率、标准油耗、机组/燃料类型、所有权、使用状态、维护时间和外部 ID |
| `maintenance_documents` | 归属类型与 ID、存储 key、文件名、MIME、大小、SHA-256、文档类型、上传人/时间、状态；仅 PDF，不存公开 URL |
| `maintenance_recognition_jobs` | 文档 ID、目标类型、状态、解析器/模型版本、幂等键、尝试次数、开始/结束时间、错误码、操作者 |
| `maintenance_recognition_results` | job ID、结构化候选 JSON、置信度、字段来源/置信度、确认状态、确认人/时间 |
| `maintenance_calculation_runs`（若需留历史） | 对象范围、输入版本/摘要、公式版本、结果 JSON、执行人、时间；若仅即时计算则首期不建此表 |

业务唯一键（人员编号、车牌、设备编号）需先定是否全局唯一或按组织唯一；PDF 识别结果只生成候选草稿，不能自动覆盖正式档案。

## 6. PDF 文件存储设计

数据库只存文件元数据和不透明 `storage_key`；PDF 字节存私有对象存储，客户端不能得到长期公开 URL。定义 `MaintenanceObjectStorage` 接口，方法至少包含 `put/get/delete/exists`；开发可提供本地私有目录适配器，生产绑定确认过的持久化对象存储。不要将当前 fact source 临时目录直接当作生产长期文件存储：现有容器部署检查明确区分临时目录与持久卷。

上传流程：

1. 用户请求上传会话，服务端校验目标实体、大小和 PDF 格式。
2. 上传至私有存储暂存区，检查扩展名、MIME 与 PDF 文件签名，限制大小、页数和处理时长，计算 SHA-256，并在部署能力允许时执行恶意内容扫描。仅靠扩展名或浏览器声明的 MIME 不能确认类型。
3. 写入文档元数据并关联实体；失败时清理孤儿对象。预览/下载由 API 校验后流式返回，或签发短时、单对象授权地址。
4. 删除走软删除和后台对象清理；不接受客户端提交的 storage key 作为可读路径。

首期仅接受 PDF。优先抽取 PDF 内嵌文本；扫描件 PDF 再走 OCR。对加密、损坏、空白或超限文档给出明确失败状态。人员证件、车辆证照和油机铭牌资料可能包含个人或敏感业务信息，应明确最小采集、保留期限、删除策略和识别供应商的数据处理约束。对象存储桶保持私有。

## 7. PDF 识别设计

PDF 识别是“辅助填写”，不是权威数据源。`PdfRecognitionProvider` 接收经过校验的 PDF，并按“文本层抽取优先、扫描页 OCR 兜底”的策略返回统一结果：字段候选值、置信度、页码/文本片段来源、解析器或模型版本和错误码。前端展示候选及来源；用户核验后提交确认，确认 API 才能写入人员/车辆/油机实体。

建议状态机：`queued → processing → needs_review → confirmed`，异常为 `failed`，取消为 `cancelled`。任务带幂等键、重试上限和超时；首期可用数据库任务表 + Nest 定时 worker，规模增长后替换专用队列。每次解析记录解析器和模型版本。

如果首期 PDF 都是电子文档，可先只实现本地文本抽取，将 OCR 留为可插拔能力；遇到扫描件且 OCR 尚未接入时，标记为“需要人工录入”，不静默生成空档案。需要确认 PDF 文档类型及字段映射、扫描件比例、OCR 供应商和数据处理地域。

## 8. API 契约草案

前缀 `/api/biz/maintenance`。示例：

```text
GET    /personnel?page=1&pageSize=20&keyword=&status=
POST   /personnel
GET    /personnel/:id
PATCH  /personnel/:id
DELETE /personnel/:id                 # 软删除
POST   /personnel/:id/documents       # 上传 PDF

GET/POST/PATCH/DELETE /vehicles[/:id]
GET/POST/PATCH/DELETE /generators[/:id]

POST   /recognition-jobs               # documentId + targetType + 可选目标 ID
GET    /recognition-jobs/:id
POST   /recognition-jobs/:id/confirm   # 经人工核验字段
POST   /recognition-jobs/:id/reject

POST   /calculations                   # calculationType、对象/输入和公式版本
GET    /calculations/:id               # 仅历史计算启用时
```

导出、批量导入、跨三类对象复杂关联不纳入首期，待 CRUD 和字段/计算口径稳定后再评估。

## 9. 首期实施顺序

1. 冻结三类实体字段、组织范围、唯一键、状态和计算公式/单位/舍入规则。
2. 增加维护域 migration、实体、DTO 和 API 契约。
3. 完成人员、车辆、油机的列表/详情/新增/编辑/软删除。
4. 实现 PDF 元数据与私有存储适配器、授权预览/下载和清理策略。
5. 实现 PDF 文本抽取和识别任务、“候选→人工确认→写实体”链路；扫描件 OCR 依据文档类型和业务需要决定首期接入或后续迭代。
6. 将确定的计算公式实现为纯领域函数并提供边界测试；按需记录 calculation run。
7. 增加与现有页面统一的前端界面和完整验收。

关键验收点：文档内容不可绕过实体访问校验；PDF 结果未经确认不覆盖档案；失败任务可重试且幂等；公式有版本、单位和舍入规则；经营管理数据及现有表无读写依赖。

## 10. 开始编码前需要确认

1. 将表格字段完整录入字段字典，并确认人员、车辆、油机各自字段与唯一规则；组织范围采用省市、维护站点还是二者。
2. 首期计算项目、公式、单位、精度与舍入规则，以及是否保留历史计算快照。
3. 导入 PDF 的文档类型与字段映射；扫描 PDF 是否必须首期 OCR，还是先提示人工录入。
4. 生产对象存储供应商/桶、区域、生命周期和备份策略。
5. PDF 大小、页数、数量和保留期限。

在第 1 项完成前，数据库迁移、DTO 和前端表单只能搭建目录和接口占位，不能根据猜测提交业务字段。
