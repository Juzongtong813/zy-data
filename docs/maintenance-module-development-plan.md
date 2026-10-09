# 维护管理模块详细开发计划

## 1. 开发目标

维护管理是独立业务域，首期支持人员、车辆、油机三类档案的增删改查、业务计算，以及 PDF 文件上传、保存和证件识别辅助录入。

复用现有登录框架、前端 `BizLayout`、Ant Design、Axios 请求封装和操作日志能力。业务数据、数据库表、API 服务和页面组件均独立建设，不读取经营管理的合同、订单、成本和报表数据。

本阶段以业务字段表为唯一字段来源，先建立目录、计划和接口边界，不编写业务代码。文档中的字段名称、类型和必填性不得脱离字段表自行扩展。

### 1.1 字段表落地规则

- 三类档案分别以人员编号、车辆编号/车牌号、油机编号作为业务识别字段；唯一范围以字段表为准。
- 字段表中的显示名称、数据库名称、类型、长度、必填、枚举、脱敏要求和是否可被识别回填，必须同步到字段字典、shared-types、DTO 和数据库迁移。
- 未出现在字段表中的字段不得进入首期表单、接口或迁移。

### 1.2 汇总表结构基线

已读取 `9月份合并汇总.xlsx` 的表格结构，未采用其中任何业务数据。工作簿包含 1 张合并说明页和 3 张明细页：人员、车辆、油机。三张明细页均为首行表头、首列序号，组织层级统一放在业务字段之前，结构可抽象为：`序号 → 省级组织 → 公司/分公司 → 地市/区域 → 三类对象字段`。

- 人员明细：A:AF，共 32 列；除组织字段外，包含人员身份、岗位/用工、联系方式、身份证及多类资质证件、证件有效期和保险/保障类字段。
- 车辆明细：A:U，共 21 列；除组织字段外，包含车牌/车辆标识、车辆类型与用途、驾驶人联系方式、登记/里程、品牌型号、燃料类型、所有权、车辆状态及交强险/商业险等保险期限字段。
- 油机明细：A:R，共 18 列；除组织字段外，包含油机编号、联系人及电话、规格型号、额定功率、标准油耗、机组类型、燃料类型、所有权、使用状态、最近维护/上传时间和油机 ID。

开发时按上述列分组建立字段字典和表单分区；表格中的重复表头后缀（如同类证件或保险期限的第 2、3 项）应在字段字典中转为可区分的证件/保单数组或明确编号字段，不得以重复数据库列名实现。

## 2. 目录规划

```text
apps/
  api/
    migration/
      <下一可用序号>_maintenance_module.sql
    src/
      maintenance/
        maintenance.module.ts
        maintenance.constants.ts
        maintenance.types.ts
        personnel/
          personnel.entity.ts
          personnel.dto.ts
          personnel.service.ts
          personnel.controller.ts
        vehicles/
          vehicle.entity.ts
          vehicle.dto.ts
          vehicle.service.ts
          vehicle.controller.ts
        generators/
          generator.entity.ts
          generator.dto.ts
          generator.service.ts
          generator.controller.ts
        documents/
          maintenance-document.entity.ts
          maintenance-document.dto.ts
          maintenance-document.service.ts
          maintenance-document.controller.ts
          storage/
            maintenance-storage.port.ts
            local-maintenance-storage.adapter.ts
        recognition/
          recognition-job.entity.ts
          recognition-result.entity.ts
          recognition.dto.ts
          recognition.service.ts
          recognition.worker.ts
          recognition-provider.port.ts
          providers/
            provider-normalizer.ts
        calculations/
          calculation.types.ts
          maintenance-calculation.service.ts
          calculation-rules.ts

  admin-web/
    src/
      api/
        maintenance.api.ts
      pages/biz/maintenance/
        MaintenanceHome.tsx
        PersonnelList.tsx
        VehicleList.tsx
        GeneratorList.tsx
        components/
          RecordFormDrawer.tsx
          PdfImportPanel.tsx
          RecognitionReview.tsx
          CalculationPanel.tsx
          DocumentList.tsx
        README.md

packages/
  shared-types/src/
    maintenance/
      personnel.ts
      vehicle.ts
      generator.ts
      document.ts
      recognition.ts
      calculation.ts
      index.ts

docs/
  maintenance-module-architecture.md
  maintenance-module-development-plan.md
```

## 3. 阶段计划

### 阶段 0：业务字段与规则冻结

输出：字段字典、状态字典、唯一键规则、组织归属规则、计算公式说明、PDF 文档类型映射表。

需要从字段表确认并冻结：

- 人员：编号、姓名、联系方式、岗位、资质、入离职状态等字段。
- 车辆：车辆编号、车牌号、车辆类型、品牌型号、登记信息、状态等字段。
- 油机：设备编号、型号、功率、位置、状态等字段。
- 人员编号、车辆编号、车牌号、油机编号是全局唯一还是按组织唯一。
- PDF 类型：身份证、行驶证、保单，以及是否允许一份 PDF 包含多页或多个对象。
- 每类资料识别后需要回填哪些字段。
- 计算指标、公式、单位、精度、舍入规则和是否保存历史结果。

字段表确认后，先补齐字段字典，再开始数据库和 API 编码；字段字典为空或仍含“待定”项时，不进入阶段 1。

验收：业务字段和计算口径没有“待定”项，或每项待定内容明确标记为后续范围。

### 阶段 1：数据库设计与迁移

追加下一可用序号的维护迁移（编码时核对现有账本，不提前占用序号），建立：

- `maintenance_personnel`
- `maintenance_vehicles`
- `maintenance_generators`
- `maintenance_documents`
- `maintenance_recognition_jobs`
- `maintenance_recognition_results`
- 可选 `maintenance_calculation_runs`

统一字段：UUID 主键、创建/更新时间、创建人/更新人、状态、软删除时间、乐观锁版本号。文件表保存 `storage_key`、原始文件名、MIME、大小、SHA-256、页数、文档类型，不保存公开 URL 和文件二进制。

验收：SQLite/MySQL 迁移均可执行；唯一索引、查询索引和状态字段符合字段字典；迁移账本和 checksum 检查通过。

### 阶段 2：共享类型与后端模块骨架

先定义 DTO 和返回类型，再实现 controller/service：

- 列表查询：分页、关键词、状态、组织筛选。
- 详情查询。
- 创建、编辑、软删除、恢复（是否开放由业务规则决定）。
- 文档上传、文档列表、预览/下载、软删除。
- 识别任务创建、状态查询、确认、驳回。
- 计算请求和计算结果。

验收：API 路径、请求参数、响应结构和错误码形成文档；共享类型和模块骨架编译通过。

### 阶段 3：PDF 文件存储

实现 `MaintenanceDocumentStorage` 端口和本地开发适配器。生产适配器单独实现，不让 controller 直接依赖云厂商 SDK。

上传流程：

1. 校验 PDF 文件头、MIME、扩展名、大小、页数和处理超时。
2. 计算 SHA-256，写入 `incoming` 临时区域。
3. 校验通过后写入正式对象路径：`maintenance/documents/YYYY/MM/hash-prefix/hash.pdf`。
4. 保存文档元数据；异常时清理孤儿对象。
5. 下载由后端校验后流式返回或生成短时授权地址。
6. 软删除后由清理任务删除对象。

验收：非法文件、路径穿越、重复文件、损坏 PDF、超大文件均有明确错误；对象存储保持私有；日志不包含文件内容和敏感字段。

### 阶段 4：三类档案 CRUD

按人员、车辆、油机分别完成实体、DTO、service、controller 和 API 客户端：

- 列表和条件查询。
- 详情和关联 PDF 列表。
- 新增和编辑。
- 软删除或停用。
- 唯一键冲突提示。
- 乐观锁冲突处理。
- 组织归属和关联关系校验。

开发顺序：人员 → 车辆 → 油机。每完成一类即做一次前后端联调，不等待三类全部完成。

验收：三类数据能独立完成完整 CRUD；无经营模块表读写；重复提交和并发编辑不会静默覆盖数据。

### 阶段 5：专用证件识别适配

识别服务采用 Provider 适配器，不在业务服务中写死供应商字段。建议先实现：

- 身份证识别：姓名、性别、民族、出生日期、住址、证件号、有效期。
- 行驶证识别：车牌号、车辆类型、所有人、品牌型号、识别代码、发动机号、注册日期等。
- 保单识别：保单号、投保人、被保人、保险公司、险种、保额、保险期限等，实际字段以供应商能力和样本验证结果为准。

识别流程：

身份证、行驶证调用专用证件接口；保单先明确是车险还是人员意外险等类型，核实供应商当前开放接口及字段覆盖，再用脱敏样本比较效果。PDF 输入不等于专用接口支持 PDF；若只支持图片，后端按页渲染并分类/裁切后调用接口，混合 PDF 按页处理。纯文本提取只能作为电子保单的补充路径。临时页面图不作为长期档案，处理结束清理；原始 PDF 保留。供应商密钥只在服务端注入。

`uploaded → queued → processing → needs_review → confirmed`

异常状态：`failed`、`cancelled`。

识别结果保存原始供应商响应摘要、标准化字段、字段置信度、页码/区域来源、供应商和模型版本。识别结果只能生成候选值，确认接口才允许回写档案。

验收：每类证件至少准备一组真实脱敏样本；识别失败可重试；重复任务幂等；低置信度字段必须进入人工确认；供应商原始字段不会直接暴露给前端业务表单。

### 阶段 6：计算服务

计算实现为纯函数或独立领域服务，禁止把公式散落在 React 页面和 controller。每个计算定义：输入字段、输出字段、单位、精度、舍入、公式版本和异常条件。

先实现即时计算；只有明确需要审计和历史对比时才启用 `maintenance_calculation_runs`。

验收：边界值、空值、非法单位、精度和重复计算均有测试；同一输入和公式版本产生稳定结果。

### 阶段 7：前端页面与统一样式

按现有 `BizLayout` 和页面模式实现：

- 维护管理首页：三类数据入口、数量概览、最近导入/识别状态。
- 人员、车辆、油机列表：筛选区、表格、分页、详情抽屉。
- 表单抽屉：新增/编辑和字段校验。
- PDF 导入面板：类型选择、上传进度、识别状态和失败重试。
- 识别确认面板：原 PDF 预览、候选字段、置信度、人工修改和确认。
- 计算面板：输入、结果、单位、公式版本和异常提示。

验收：桌面端和移动端布局与现有页面一致；加载、空数据、错误、上传中、识别中、确认完成等状态完整；浏览器不会保存长期文件地址。

### 阶段 8：联调与发布检查

- API 单元测试：DTO、状态机、唯一键、文件校验、存储 key、识别标准化、计算公式。
- 集成测试：上传 PDF → 保存 → 创建识别任务 → 确认 → 回写档案。
- 文件处理测试：路径穿越、伪造 MIME、重复任务、超限文件、混合页及处理超时；沿用现有登录框架，不新增维护权限设计。
- 浏览器测试：三类 CRUD、PDF 上传、识别确认、计算展示。
- 部署检查：对象存储持久性、密钥注入、第三方 API 超时、失败重试、日志脱敏和数据保留策略。

## 4. 首批编码顺序

正式开始编码时按以下顺序提交，便于每一步可审查：

1. 阶段 0 的字段和计算规则文档。
2. shared-types 维护类型目录。
3. 数据库迁移和实体。
4. 维护模块 CRUD API。
5. 本地 PDF 存储适配器和文档 API。
6. 前端三类 CRUD 页面。
7. 识别 Provider 和人工确认流程。
8. 计算服务和计算面板。
9. 测试、联调和发布检查。

## 5. 暂不纳入

- 新增模块权限码、角色授权和数据范围设计。

- 经营管理数据关联。
- 复杂工单、巡检、维修流程。
- Excel 批量导入和导出。
- 图片直接上传识别。
- 未确认的自动回写。
- 多供应商同时路由和自动择优。
