<div align="center">

# 🇸🇬 SG Content Agent

### 新加坡留学博主 AI 智能内容创作平台

基于 AI 驱动的小红书内容全流程自动化工具——从选题策划、知识检索、风格克隆、内容生成、质量评审到发布管理。

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)](https://vuejs.org/)
[![Koa 2](https://img.shields.io/badge/Koa-2.15-3399ff?logo=koa)](https://koajs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)](https://github.com/WiseLibs/better-sqlite3)
[![Naive UI](https://img.shields.io/badge/Naive_UI-2.40-18a058)](https://www.naiveui.com/)

</div>

---

## 📖 项目简介

**SG Content Agent** 是一个面向**新加坡留学赛道小红书博主**的全自动内容创作平台。它将 AI 能力深度融入内容创作的每一个环节，帮助博主：

- 🎯 **精准选题**：基于赛道数据分析和竞品监控，AI 自动推荐爆款选题并评分排序
- 📚 **知识驱动**：内置结构化新加坡留学知识库（院校、专业、费用、签证、租房等），生成内容时自动检索引用真实数据
- 🎨 **风格克隆**：自动分析博主历史爆款的写作风格（开头模式、段落长度、高频词、emoji 使用、语气语调），生成内容时完美复刻博主个人风格
- ✍️ **一键生成**：输入选题即可自动生成完整的小红书图文内容（标题候选 + 正文 + 标签），支持分类专属模板
- 🔍 **质量评审**：三维度自动评分（风格匹配度 / 事实准确性 / 可读性），附改进建议
- 📅 **发布管理**：内容排期、发布队列、效果数据回收，形成闭环

整个平台遵循 **Hermes Agent + Skills** 架构理念，每个核心能力都可被 AI Agent 调用，实现真正的自动化运营。

---

## ✨ 核心功能

### 1. 📊 仪表盘总览
- 一目了然的内容运营数据统计（采集量 / 选题数 / 生成数 / 知识库量 / 平均质量分）
- 今日排期、热门选题、待审内容、最近动态

### 2. 📋 智能选题管理
- AI 自动推荐选题，从 7 大分类中选择（院校相关、申请攻略、生活指南、费用相关、政策解读、就业发展、热点时效）
- 选题评分排序，支持手动创建 / 编辑 / 审批
- 选题日历视图，方便安排发布节奏

### 3. ✍️ AI 内容生成
- 选择已审批的选题，一键生成完整小红书图文
- 自动检索知识库中的真实数据作为素材引用
- 自动注入博主风格画像
- 引用博主历史爆款作为参考
- 生成 3 个标题候选 + 800-1200 字正文 + 标签
- 自动质量评分，80+ 分自动通过，60-80 进入人工审核

### 4. 📚 知识库管理
- 结构化管理新加坡留学领域知识（14 个分类）
- 支持搜索、分类筛选、批量管理
- 知识条目含标题、内容、标签、结构化数据、来源、验证状态
- 生成内容时自动关联引用

### 5. 🎨 博主风格分析
- 自动分析博主历史内容的写作风格
- 多维度分析：标题模式、开头模式、段落长度、高频词、emoji 频率、互动引导（CTA）、语气语调
- 风格画像版本管理，支持重新分析
- 生成内容时自动应用最新风格画像

### 6. 📦 内容采集
- 支持自采内容（自己的爆款）和竞品内容管理
- 按平台、来源类型筛选
- 内容含互动数据（点赞 / 收藏 / 评论 / 分享 / 浏览）

### 7. 🚀 发布管理
- 内容排期与发布队列
- 支持多平台（小红书、抖音、公众号）
- 发布状态追踪（待发布 / 已发布 / 发布失败）
- 效果数据回收（发布后录入互动数据）
- 效果统计面板

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Web 管理后台 (Vue 3)                   │
│  Dashboard │ Topics │ Content │ Knowledge │ Style │ Pub  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP API (44 个接口)
┌──────────────────────┴──────────────────────────────────┐
│                  后端服务 (Koa 2 + TypeScript)            │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ 选题引擎 │ │ 内容生成器 │ │ 风格分析器 │ │ 发布管理器   │  │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────┬──────┘  │
│       │           │            │               │          │
│  ┌────┴───────────┴────────────┴───────────────┴──────┐  │
│  │              LLM Client (OpenAI 兼容接口)            │  │
│  │     ┌─────────────────┐ ┌───────────────────────┐  │  │
│  │     │ Mock 模式 (演示) │ │ 真实 API (OpenAI 等)  │  │  │
│  │     └─────────────────┘ └───────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│       │           │            │                           │
│  ┌────┴───────────┴────────────┴──────────────────────┐  │
│  │              SQLite 数据库 (better-sqlite3)          │  │
│  │  contents │ topics │ knowledge │ generated_contents  │  │
│  │  style_profiles │ metrics │ crawl_tasks │ competitors│  │
│  │  publishing_queue                                    │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 内容生成流程

```
选题审批 → 知识检索(RAG) → 风格注入 → 引用历史爆款 → LLM生成 → 质量评分 → 存储 → 人工审核 → 发布
```

---

## 📁 项目结构

```
sg-content-agent/
├── docs/                            # 📄 项目文档
│   ├── architecture.md              #    系统架构设计（含 Hermes Skills 说明）
│   ├── mvp-plan.md                  #    MVP 开发计划（6 周，含数据库 Schema、API 设计）
│   └── gap-analysis.md              #    生产就绪度差距分析
│
├── packages/
│   ├── server/                      # 🔧 后端服务
│   │   └── src/
│   │       ├── index.ts             #    入口：启动、初始化、路由注册
│   │       ├── config.ts            #    配置管理
│   │       ├── db/
│   │       │   ├── database.ts      #    数据库初始化（9 张表 + 索引）
│   │       │   └── seed/            #    种子数据（14 知识 + 6 内容 + 5 选题）
│   │       ├── services/
│   │       │   ├── auth.ts          #    HMAC 签名 Token 认证
│   │       │   ├── logger.ts        #    Pino 日志
│   │       │   ├── llm/
│   │       │   │   └── client.ts    #    LLM 客户端（OpenAI 兼容 + Mock 模式）
│   │       │   └── sg-content/
│   │       │           ├── content-generator.ts  # 内容生成引擎（核心）
│   │       │           ├── topics.ts             # 选题管理
│   │       │           ├── knowledge.ts           # 知识库管理 + 搜索
│   │       │           ├── contents.ts            # 采集内容管理
│   │       │           ├── generated-contents.ts  # 生成内容 CRUD
│   │       │           ├── dashboard.ts           # 仪表盘聚合
│   │       │           └── publishing.ts          # 发布管理
│   │       ├── controllers/         #    API 控制器（7 个模块）
│   │       └── routes/              #    路由定义（44 个接口）
│   │
│   └── client/                      # 🖥️ 前端界面
│       └── src/
│           ├── main.ts              #    应用入口
│           ├── App.vue              #    全局布局（Sidebar + 路由视图）
│           ├── router/              #    路由（9 页面 + 登录守卫）
│           ├── stores/              #    Pinia 状态管理
│           ├── api/                 #    API 客户端（8 个模块）
│           ├── views/sg-content/    #    页面组件（8 个视图）
│           │   ├── DashboardView.vue
│           │   ├── TopicsView.vue
│           │   ├── ContentView.vue
│           │   ├── ContentDetailView.vue
│           │   ├── KnowledgeView.vue
│           │   ├── CollectionView.vue
│           │   ├── PublishingView.vue
│           │   └── StyleView.vue
│           ├── components/layout/   #    布局组件
│           └── styles/              #    全局样式
│
├── tests/                           # 🧪 单元测试（17 个测试用例）
│   └── server/services/
│       └── knowledge.test.ts
│
├── vite.config.ts                   # Vite 前端配置（端口 8650）
├── vitest.config.ts                 # Vitest 测试配置
├── docker-compose.yml               # Docker 编排
├── Dockerfile                       # Docker 构建
└── package.json                     # 依赖管理
```

---

## 🔌 API 接口一览

| 模块 | 接口数 | 说明 |
|------|--------|------|
| 认证 | 2 | 登录、Token 验证 |
| 仪表盘 | 5 | 统计数据、最近动态、待审内容、热门选题、今日排期 |
| 选题管理 | 6 | CRUD + 日历视图 + 批量操作 |
| 内容生成 | 4 | 生成内容、AI 推荐选题、风格分析、风格画像查询 |
| 生成内容 | 7 | CRUD + 审批 + 驳回 |
| 知识库 | 8 | CRUD + 分类统计 + 搜索 |
| 采集内容 | 5 | CRUD + 统计 |
| 发布管理 | 7 | 队列 + 排期 + 发布 + 效果数据 + 统计 |
| **合计** | **44** | |

---

## 🛠️ 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **前端框架** | Vue 3 (Composition API + `<script setup>`) | 最新 Vue 3 写法 |
| **UI 组件库** | Naive UI 2.40 | 轻量级 Vue 3 组件库 |
| **状态管理** | Pinia | Vue 3 官方推荐 |
| **路由** | Vue Router 4 (Hash History) | 前端路由 |
| **构建工具** | Vite 6 | 极速开发体验 |
| **后端框架** | Koa 2 + TypeScript | 轻量级 Node.js 框架 |
| **数据库** | SQLite (better-sqlite3) | 零配置、单文件、高性能 |
| **LLM 接口** | OpenAI 兼容 API | 支持 OpenAI / Claude / 任何兼容 API |
| **认证** | HMAC 签名 Token | 无外部依赖 |
| **日志** | Pino + pino-pretty | 高性能结构化日志 |
| **部署** | Docker + Docker Compose | 一键部署 |

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9
- （可选）Docker & Docker Compose 用于容器化部署

### 1. 克隆项目

```bash
git clone https://github.com/hlong026/sg-content-agent.git
cd sg-content-agent
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发环境

```bash
# 同时启动前后端
npm run dev
```

或分别启动：

```bash
# 终端 1 — 启动后端 (端口 8649)
npm run dev:server

# 终端 2 — 启动前端 (端口 8650)
npm run dev:client
```

### 4. 访问系统

打开浏览器访问 **http://localhost:8650**

- 默认密码：`admin123`

### 5. 配置真实 LLM（可选）

系统默认使用 Mock 模式（无需 API Key 即可体验完整功能）。要启用真实 AI 生成：

```bash
# 方式一：OpenAI API
export OPENAI_API_KEY=sk-xxx

# 方式二：兼容接口（如 Claude via 中转、本地部署等）
export LLM_BASE_URL=https://your-api-endpoint/v1
export LLM_MODEL=gpt-4o-mini
```

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 访问
# http://localhost:8649
```

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

测试覆盖：
- Knowledge CRUD（6 个测试）
- Topics 管理（4 个测试）
- 内容生成流程（2 个测试）
- 仪表盘统计（1 个测试）
- LLM Mock 路由正确性（4 个测试，防止回归）

---

## 📸 功能截图

### 仪表盘
全局数据概览，包含内容统计、今日排期、热门选题、待审内容。

### 选题管理
- AI 推荐选题按钮，一键获取爆款选题建议
- 选题评分排序、状态筛选
- 创建/编辑选题弹窗
- 一键生成内容

### 内容生成
- 三维质量评分可视化（风格/准确性/可读性）
- 候选标题选择
- 标签管理
- 正文编辑与预览
- 审批/驳回/发布操作

### 知识库
- 分类统计面板
- 全文搜索
- 分类筛选
- 知识条目增删改查

### 风格分析
- 博主风格画像展示
- 多维度分析结果
- 一键重新分析

---

## 🤖 Hermes Agent + Skills 架构

本项目遵循 **Hermes Agent + Skills** 设计模式。每个核心能力被封装为独立的 Skill，AI Agent（如 Hermes）可通过读取 `SKILL.md` 了解何时调用、如何调用。

内置 5 个 Skills：

| Skill | 说明 |
|-------|------|
| `content-generator` | 内容生成——根据选题自动生成小红书图文 |
| `topic-scorer` | 选题评分——从热度、历史、差异化等维度评分 |
| `style-analyzer` | 风格分析——自动分析博主写作风格并生成画像 |
| `knowledge-manager` | 知识管理——维护和检索新加坡留学知识库 |
| `content-publisher` | 内容发布——管理发布队列和多平台发布 |

Skills 安装在 `~/.hermes/skills/sg-content/` 目录下，每个 Skill 包含一个 `SKILL.md` 文件，定义了：
- **何时触发**（When to use）
- **如何调用 API**（API endpoints）
- **输入输出格式**
- **评分标准与策略**

---

## 📊 生产就绪度分析

| 维度 | 状态 | 说明 |
|------|------|------|
| ✅ 完整业务流程 | **已完成** | 选题→生成→审核→发布 全流程闭环 |
| ✅ Web 管理后台 | **已完成** | 8 个页面，44 个 API，完整 CRUD |
| ✅ AI 内容生成 | **已完成** | 支持分类模板、知识检索、风格注入 |
| ✅ 质量评分 | **已完成** | 三维度评分 + 改进建议 |
| ✅ 知识库 | **已完成** | 14 个种子知识，支持搜索和分类 |
| ✅ 单元测试 | **已完成** | 17 个测试用例 |
| ⚠️ 真实 LLM | **需配置** | 配置 OPENAI_API_KEY 即可使用 |
| ⚠️ 数据采集 | **待开发** | 需开发 Playwright 小红书爬虫 |
| ⚠️ 自动发布 | **待开发** | 需开发 Playwright RPA 发布模块 |
| ⚠️ 定时任务 | **待开发** | 定时采集/推荐/指标回收 |
| ⚠️ 知识库扩充 | **需补充** | 目标 200-500 条，当前 14 条 |

详细分析见 [docs/gap-analysis.md](./docs/gap-analysis.md)

---

## 📄 文档

- [系统架构设计](./docs/architecture.md) — 完整的架构设计、数据库 Schema、API 规划
- [MVP 开发计划](./docs/mvp-plan.md) — 6 周 MVP 方案，含详细页面 Mockup
- [差距分析](./docs/gap-analysis.md) — 生产就绪度评估，7 个待改进项

---

## 🗺️ 开发路线图

- [x] **Phase 1** — 项目架构 + 数据库 + 基础 CRUD + Web 后台
- [x] **Phase 2** — AI 内容生成引擎 + 知识库检索 + 风格分析
- [x] **Phase 3** — 质量评分 + 审核流程 + 发布管理
- [ ] **Phase 4** — Playwright 小红书数据采集
- [ ] **Phase 5** — Playwright 小红书自动发布
- [ ] **Phase 6** — 定时任务调度 + 数据闭环 + 自进化

---

## ⚖️ 开源协议

[MIT License](./LICENSE)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

</div>
