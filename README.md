# QingProcess 全源流程资产管理平台

前后端分离架构体系与项目组织规范：

```
QingProcess/
├── frontend/               # 【前端工程】AI Studio 开发构建
│   ├── src/                # React 19 + TypeScript 源码与组件
│   ├── public/             # 静态资源、Drawio 引擎画板与图标
│   ├── index.html          # 前端 HTML 入口
│   ├── vite.config.ts      # 前端 Vite 8 构建配置
│   ├── package.json        # 前端独立依赖与运行脚本
│   ├── tsconfig.json       # 前端 TypeScript 编译配置
│   └── README.md           # 前端开发说明文档
│
├── backend/                # 【后端服务】Codex 开发构建
│   ├── server.ts           # Express RESTful API 服务与持久化控制器
│   ├── package.json        # 后端独立依赖与启动脚本
│   ├── tsconfig.json       # 后端 TypeScript 配置
│   └── README.md           # 后端接口与开发说明文档
│
└── package.json            # 根工程 Monorepo 编排与统一脚本
```

## 目录分工与职责
1. **`frontend/`**：由 **AI Studio** 专注维护与更新的用户界面，包含流程设计画板、业务集成视图、架构卡片与标准表头（支持负责部门、负责人、协作者、适用范围组织架构选择）、权责审核看板等。
2. **`backend/`**：由 **Codex** 专注维护与更新的后端服务，包含 REST API 接口、数据持久化存储、用户鉴权与流程生命周期控制。

## 本地与独立启动

### 启动前端 (AI Studio)
```bash
cd frontend
npm install
npm run dev
```

### 启动后端 (Codex)
```bash
cd backend
npm install
npm start
```
