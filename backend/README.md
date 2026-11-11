# QingProcess NestJS + PostgreSQL 后端

本工程从历史原型迁移了 **133 条 `/api/*` 路由**，对照前端请求保留接口地址及响应包装，并补齐前端已经调用但原型缺失的接口。历史原型位于 [根目录原型 server.ts](../server.ts)，生产进程不会导入它。完整清单见 [routes.json](docs/routes.json)、[frontend-requests.json](docs/frontend-requests.json) 和 [迁移说明](docs/MIGRATION.md)。

使用 NestJS 11、Node.js 22、PostgreSQL 16。生产进程不导入原型 `server.ts`，不依赖 Vite，也不使用进程全局数组保存业务数据。登录采用密码哈希与可撤销的 HttpOnly Cookie 会话。

## 快速启动

先准备 Node.js 22 和 PostgreSQL 16。下列命令在本目录运行：

```sh
npm ci
cp .env.example .env
```

编辑 `.env`：设置 `DATABASE_URL`、`APP_ORIGIN=http://localhost:3000`，并为 `BOOTSTRAP_PASSWORD` 设置6–32 个字符的唯一密码。数据库必须是新建的专用数据库。

```sh
node --env-file=.env --import tsx scripts/migrate.ts
node --env-file=.env --import tsx scripts/bootstrap.ts
npm run build
node --env-file=.env dist/main.js
```

迁移在事务中执行并记录 SHA-256 校验和，可重复运行。初始化只允许在没有用户的库中执行，建立一个管理员、根架构和表单模板，不导入演示业务数据。初始化完成后移除运行环境中的 `BOOTSTRAP_PASSWORD`。

在仓库根目录运行前端开发服务器，Vite 已将 `/api` 代理至 `http://127.0.0.1:3001`。可使用 `API_TARGET` 调整代理地址。原型的默认账号密码和失败后自动登录已移除。

## 建表 DDL 和数据设计

[001_initial.sql](migrations/001_initial.sql) 是可直接执行的初始 PostgreSQL DDL。后续结构变更新增三位递增编号 SQL 文件，迁移程序校验历史 checksum 并按顺序执行；不要修改已应用版本。建表包括业务聚合表、账号凭据、会话、限流桶、设置、审计、幂等记录、发布版本、文件和挖掘事件。业务表具备主键、排序、修订号、时间戳及必要的外键和唯一索引。

每个业务实体保存一行 `payload JSONB`；不是将整个应用状态保存成一个数据库字段。手册内部的分类/事项、审批级次和表单字段属于嵌套聚合。稳定关联（流程所属架构、用户所属部门、任务所属流程等）通过生成列及外键约束；动态字段通过服务校验。这是兼容现有宽对象契约的聚合模型，**不是完全第三范式的关系模型**。

业务请求从数据库读取请求独立的状态，结束时仅写入变更实体。所有业务写事务先获取 PostgreSQL advisory lock，避免批量导入、审批和跨表同步丢失更新；查询使用一致性快照。变更、发布快照、凭据修改、审计及幂等结果在同一个事务提交，失败全部回滚。

当前兼容层读取全部业务聚合并串行化业务写入，适用于先完成迁移和业务验收，**尚不能视为经过容量验收的高并发实现**。大数据量上线前应按业务域拆分 SQL 查询/分页与锁粒度并压测。挖掘事件独立存储，不进入上述状态快照。

## API 与权限

- `POST /api/session`：`{ "userId": "admin", "password": "..." }`；成功设置 `qp_session` Cookie。
- `GET /api/session`：返回当前用户；禁用账号、过期或退出的会话返回 401。
- `POST /api/app/site/logout`：撤销服务端会话。
- `GET /api/openapi.json`：登录后获取 OpenAPI 3.1 文档；关键写接口定义字段级 schema，与运行时 Zod 校验共享来源。历史动态接口明确标记 extensible，不代表全部字段都严格定义。生成前端类型及同步门槛见 [同步规范](../docs/FRONTEND_SYNC.md)。
- `GET /health/live`、`GET /health/ready`：存活与数据库迁移就绪检查。
- `POST /api/files`：`{ "filename": "制度.pdf", "contentType": "application/pdf", "base64": "..." }`；返回文件 ID。将该 ID 作为制度条目的 `fileId` 后，现有下载接口返回原始字节。单文件不超过 5MB。

默认保留 `{ status: 1, data, info }`，原型使用的 `rows/list/total/stats/allTasks` 等字段也保留。错误统一返回适当 HTTP 状态码及 `{ status: 0, data: null, info, requestId }`。写操作可传 `Idempotency-Key`；相同用户、同一个键的相同请求重放返回之前的结果，内容不同返回 409。建议审批客户端使用该头避免重复点击推进两个审批级次。

权限字段为 `accessRoles`：`admin` 管理全系统，`editor` 编辑业务，`auditor` 审批/发布，`viewer` 只读。业务 `roleNames` 与系统授权字段分离，管理员可以通过用户新增/更新接口设置 `accessRoles`。新用户默认只读；批量导入账号没有默认密码，须由管理员重置密码后才能登录。密码重置、禁用和权限变更会撤销已有会话。至少保留一个启用的管理员。

目前部署边界为单企业共享数据空间，读取权限为企业成员级；手册 `viewPermissions`、部门范围和流程协作者不是完整的行级 ACL。若业务要求跨部门保密或多租户隔离，须先实现对应的数据授权策略再上线。

## 真实能力与明确边界

| 模块 | 行为 |
| --- | --- |
| 流程、字典、组织、角色、术语、表单 | PostgreSQL 持久化；修复缺失路由、人员分配方法/字段不一致、目录重命名/删除 |
| 流程发布/审核 | 真实版本快照、状态检查、重复审批冲突、审核操作人来自会话 |
| 权责审核 | 逐级审批、转办、驳回及手册事项同事务更新；终态不能重复处理 |
| 执行任务 | 从已发布的未压缩 XML 活动创建步骤，全部完成后才能办结；属于任务清单执行，非完整 BPMN 分支/并行网关引擎 |
| 日志导入 | 解析 CSV/JSON、逐行校验、确定性去重、真实事件计数/流转图/周期统计 |
| 外部系统抽取 | 未提供 CRM/ERP 等真实连接器和凭据，返回 503，不伪造提取结果 |
| 挖掘诊断 | 基于真实统计生成说明；没有标杆基线时不编造分数、根因或 ROI |
| AI | 配置 `GEMINI_API_KEY` 后调用真实模型，20 秒超时及结构校验；未配置/失败返回 503。规则体检与布局动作无需模型 |
| 商业授权 | 服务器只用公钥验证离线签名；在线签发接口明确返回 403 |
| 演示重置 | 保留路由但返回 409；不允许将生产数据重置为演示样本 |
| API 管理 | 保存接口目录；调试仅允许本地只读白名单，不会执行任意外部 URL；尚非开放 API 网关 |

AI 自动生成、真实外部系统和离线许可证签发未连接真实生产服务进行验收。前端部分页面仍含原有本地演示计算/数据，例如流程挖掘连接器配置并未持久化；这些不是本次已有 API 契约覆盖的功能。

## 日志导入示例

`POST /api/mining/import-logs` 的 `rawData` 可为 JSON 数组字符串，或以下 CSV 文本：

```csv
CaseId,Activity,Timestamp,SourceSystem,Operator
C001,申请,2026-10-01T09:00:00+08:00,ERP,张三
C001,批准,2026-10-02T10:00:00+08:00,ERP,李四
```

可附加 `datasetKey`，默认 `imported`。同一数据集内案例、活动、时间、来源系统、操作人完全一致的事件按重复记录处理。单批最多 10000 行、原始文本最多 2MB。CSV 使用标准引号/转义解析，不通过拆分逗号实现。

## 部署

### 本机 Docker 开发环境

本地 HTTP 开发请叠加 [compose.local.yml](compose.local.yml)，避免生产配置要求 HTTPS 导致无法启动。本地配置使用 Node 22 Alpine；生产 Dockerfile 默认使用 Node 22 Debian slim。先在 `.env` 设置 `POSTGRES_PASSWORD` 和 `BOOTSTRAP_PASSWORD`。数据库密码与主机使用的 `DATABASE_URL` 保持一致。

```sh
docker compose -p qingprocess -f compose.yml -f compose.local.yml up -d db
docker compose -p qingprocess -f compose.yml -f compose.local.yml build api tools
docker compose -p qingprocess -f compose.yml -f compose.local.yml run --rm tools npm run migrate
# 仅第一次空库初始化时执行：
docker compose -p qingprocess -f compose.yml -f compose.local.yml run --rm tools npm run bootstrap
docker compose -p qingprocess -f compose.yml -f compose.local.yml up -d api
docker compose -p qingprocess -f compose.yml -f compose.local.yml run --rm tools npm test
```

后端地址 `http://localhost:3001`，就绪检查 `/health/ready`；PostgreSQL 为 `localhost:5432`，数据库/用户名均为 `qingprocess`。管理员默认 `admin`，密码为本地 `.env` 的 `BOOTSTRAP_PASSWORD`。容器化维护工具包含迁移和测试依赖，主机不必安装 Node.js。数据库存储在 `qingprocess_database` 命名卷，普通停止/启动不会清空；不要使用 `down -v`，除非确定要删除数据库。

启动完整前后端：`docker compose -p qingprocess -f compose.yml -f compose.local.yml up -d --build frontend`。前端地址为 `http://localhost:3000`，Nginx 将同源 `/api` 请求转发给后端，Cookie 登录无需跨域配置。前端开发及浏览器测试见 [根目录说明](../README.md)。本地覆盖文件只用于开发，生产部署不要加载它。

### 生产部署

提供 [Dockerfile](Dockerfile)、[Compose](compose.yml) 和 [Nginx 配置片段](deploy/nginx.conf.example)。数据库端口和 API 端口仅绑定本机回环地址。先启动数据库、从受控维护环境执行迁移/初始化，再启动 API；生产容器不自动迁移数据库，也不携带引导密码。

```sh
export POSTGRES_PASSWORD='替换为强密码'
export APP_ORIGIN='https://process.example.com'
docker compose up -d db
# 按快速启动章节设置 DATABASE_URL 并执行 migrate/bootstrap
docker compose up -d --build api
```

生产 `APP_ORIGIN` 必须为 HTTPS。将前端和 API 放在同一站点，使用 HttpOnly + Secure + SameSite=Strict Cookie。写请求校验 Origin；服务到服务请求可携带已建立会话的 Bearer token，但不提供静态万能 token。反向代理使用真实客户端地址并仅信任明确配置的 `TRUST_PROXY` 地址范围。

建议为迁移账号和运行账号分别授权；运行账号不授予 DDL 权限，审计表只授予 INSERT/SELECT。配置 PostgreSQL TLS、数据库备份与恢复演练。审计记录不保存密码/令牌/原始请求体；stdout JSON 日志包含请求 ID、路径、状态和耗时。[maintenance.sql](migrations/maintenance.sql) 可由运维每日清理过期会话、限流桶及超过七天的幂等记录，不删除业务审计。

授权发行方可在离线环境执行 `npx tsx scripts/issue-license.ts claims.json private-key.pem`；签名内容包含 `companyName/machineCode/edition/authUsersCount/expireDate`。API 服务器只配置对应 `LICENSE_PUBLIC_KEY` 和部署固定的 `MACHINE_ID`；公钥验证不是物理硬件防篡改机制。

## 验证

```sh
npm test
# 可选真实 PostgreSQL 多连接测试（使用专用测试数据库）：
TEST_DATABASE_URL=postgresql://... npm test
npm audit --omit=dev --audit-level=high
```

测试使用 PGlite 运行真实 PostgreSQL SQL 引擎，验证 DDL、约束、回滚、持久化、Cookie 登录、实际 Nest HTTP 路由、版本历史、幂等、逐级审批、执行步骤、字节级文件下载和 CSV 去重。PGlite 测试适配器串行化连接，不用于证明多进程锁行为。额外的真实 PostgreSQL 测试验证并发写入和竞争审批；GitHub Actions 已配置 PostgreSQL 16 服务运行它。

本地已通过后端 TypeScript 编译、22 项测试及依赖审计（0 漏洞）。已构建并启动本地 Docker 环境，完成 PostgreSQL 16 迁移和管理员初始化；真实 PostgreSQL 多连接并发、竞争审批、迁移升级与回滚测试通过，无跳过。前端依赖冲突已修复，TypeScript 检查、生产构建及浏览器联调通过。生产负载、备份恢复与外部服务验收尚未执行。因此这是具备生产基础设施的可运行迁移工程，**不是已经通过生产上线验收的成品**。

## 2026-11-10 前端更新同步

已补齐最新前端的审批路径、审批履历、多级/定时发布、集成图、组织角色和模型配置实现，并同步部署前端组件。核验基线、检查命令及外部服务验收边界见 [前后端同步核验](docs/FRONTEND_PARITY.md)。`npm run check:frontend` 可持续检查两套前端的请求地址和方法；它不能替代业务和外部系统验收。

## 2026-11-11 完整性核验

GitHub 最新前端对照基线为 main/c80d5b914ae23b99bbf63e5e34aff3d18e3744bd。岗位/职位 CRUD、jobs 别名、批量删除、部门名称导入和引用保护已补齐；既有审批、模型、授权及发布快照实现已同步。36项测试全部通过（包含真实 PostgreSQL 多连接和迁移测试，无跳过），两套 GitHub 前端444个请求分支无缺失、无未解析项。新增CI会持续执行这些检查；CI远程运行状态需在对应提交查看。详细结论和未完成边界见 [完整性报告](docs/INTEGRITY_20261111.md)。

backend/server.ts 仅作为 Nest 服务的兼容启动入口；根目录 npm start/dev 也转到 backend，避免误启动内存原型。正式运行前先完成依赖安装、迁移、初始化和 npm run build；环境变量设置方式见快速启动。
