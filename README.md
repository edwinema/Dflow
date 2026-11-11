# Dflow 流程资产管理平台

前端位于 frontend/（React/TypeScript），正式后端位于 backend/src/（NestJS/PostgreSQL）。根目录 src/ 是另一套前端源码，同步检查同时覆盖两套前端。

backend/server.ts 是正式 Nest 服务的兼容启动入口；根目录 server.ts 为历史内存原型，仅供迁移参考。根目录 npm start 和 npm run dev 均启动正式后端。

后端需要 Node.js 22 和 PostgreSQL 16。先按 [后端说明](backend/README.md) 配置环境、安装依赖、执行迁移并初始化管理员，再在 backend 运行 npm run build 和 npm start。

前端开发：在 frontend 运行 npm ci 和 npm run dev，同源 /api 代理到后端3001端口。生产打包运行 npm run build。

验证：在 backend 运行 npm test 和 npm run check:frontend。设置独立的 TEST_DATABASE_URL 可执行真实 PostgreSQL 多连接和迁移测试。Backend integrity 工作流自动执行这些检查。

[完整性报告](backend/docs/INTEGRITY_20261111.md) 记录核验基线、修复内容、测试证据与能力边界。接口覆盖和测试通过不等同于所有业务场景均已完成生产验收。
