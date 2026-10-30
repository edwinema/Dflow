# QingProcess 后端服务 (Codex)

全源流程资产管理平台后端接口服务，由 Codex 开发构建。

## 技术栈
- **运行时**: Node.js / tsx
- **Web 框架**: Express.js
- **大模型 SDK**: @google/genai (Gemini API)
- **协议**: RESTful JSON API

## 核心 API 业务模块
- `/api/flow/type/*`: 流程架构树增删改查、版本发布、资料卡片全量更新
- `/api/flow/model/*`: 流程模型生命周期、Drawio XML 流程图保存与读取
- `/api/flowdoc/*`: 制度文件、风险合规、DOA权责审查与核准
- `/api/system/company/*`: 组织架构树与部门人员
- `/api/execute/*`: 流程执行任务流转
- `/api/session`: 用户身份与权限校验

## 启动与运行
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动服务 (默认监听 3001 或统一端口)
npm start
```
