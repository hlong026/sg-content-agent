# MVP 方案 — 第一阶段开发计划

> 目标：4-6 周内交付「能自动采集 → 分析选题 → 生成内容 → 发布小红书」的最小可用产品

---

## 一、MVP 范围定义

### 做（In Scope）

```
✅ 小红书平台（单一平台优先跑通）
✅ 博主自有内容采集 + 结构化存储
✅ 竞品内容采集（3-5 个对标账号）
✅ 选题归类 + 评分（简化版）
✅ 博主风格画像（自动分析）
✅ 知识库核心数据（手动录入 50 条）
✅ LLM 内容生成（小红书图文）
✅ 质量评分（简化版）
✅ 小红书自动发布（RPA）
✅ Web 管理后台（核心页面）
✅ 基础反馈闭环（数据回收 + 人工标注）
```

### 不做（Out of Scope）

```
❌ 其他平台（抖音/公众号/微博 — Phase 2）
❌ 视频内容生成
❌ 自动进化系统（Phase 2）
❌ 热点应急流程
❌ A/B 测试
❌ 多博主支持
```

---

## 二、MVP 系统架构

```
┌──────────────────────────────────────────────────────────────────┐
│                    Web 管理后台 (Vue 3)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 仪表盘   │ │ 选题中心  │ │ 内容工坊  │ │ 知识库   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ 数据采集  │ │ 发布管理  │ │ 风格画像  │                       │
│  └──────────┘ └──────────┘ └──────────┘                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST API + WebSocket
┌──────────────────────┼───────────────────────────────────────────┐
│                 Koa Backend (BFF)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 采集控制  │ │ 选题引擎  │ │ 生成引擎  │ │ 发布引擎  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────────┐
│              Hermes Agent + Skills                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │ xhs_crawler    │ │ topic_scorer   │ │ content_writer │      │
│  │ competitor_mon │ │ style_analyzer │ │ xhs_publisher  │      │
│  │ knowledge_mgr  │ │ quality_scorer │ │ metrics_collect│      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
│                                                                 │
│  Memory: SQLite + ChromaDB                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、第一阶段开发内容（按周拆解）

### Week 1-2：基础设施 + 数据采集

#### 后端基础

```
1. 项目初始化
   ├── Fork hermes-web-ui 项目结构
   ├── 配置 Docker Compose（PostgreSQL + Redis + ChromaDB）
   ├── 搭建 Koa 后端骨架（路由/控制器/服务层）
   └── 搭建 Vue 3 前端骨架（路由/布局/主题）

2. 数据库 Schema 设计
   ├── contents 表（采集的内容，含平台、标题、正文、标签、互动数据）
   ├── topics 表（选题分类、评分、状态）
   ├── knowledge 表（知识库条目）
   ├── generated_contents 表（生成的内容、评分、发布状态）
   ├── style_profiles 表（博主风格画像）
   ├── publishing_schedule 表（发布排期）
   └── metrics 表（内容表现数据）
```

#### 数据采集 Skills

```
3. 小红书采集 Skill (xhs_crawler)
   ├── 输入：博主小红书 ID
   ├── 功能：
   │   ├── 通过 Playwright 模拟登录
   │   ├── 采集笔记列表（标题、正文、标签、图片URL）
   │   ├── 采集互动数据（点赞、收藏、评论数）
   │   └── 增量采集（记录上次采集时间，只拉新内容）
   ├── 输出：结构化 JSON → 存入 contents 表
   └── 定时：每日凌晨 2:00 自动执行

4. 竞品采集 Skill (competitor_monitor)
   ├── 输入：竞品账号列表（配置文件）
   ├── 功能：同 xhs_crawler，采集竞品内容
   ├── 输出：结构化 JSON → 存入 contents 表（标记为竞品）
   └── 定时：每日凌晨 3:00

5. 内容清洗与结构化
   ├── 去除 HTML 标签
   ├── 提取标签/话题
   ├── 提取关键数据（数字、院校名、专业名）
   └── 存入向量数据库（ChromaDB）供后续 RAG
```

#### Web 页面（对应后端功能）

```
6. 数据采集页面
   ├── 采集任务列表（状态：待执行/执行中/完成/失败）
   ├── 手动触发采集按钮
   ├── 采集结果预览（最近采集的内容列表）
   ├── 竞品账号管理（添加/删除竞品）
   └── 采集配置（频率、数量限制）
```

---

### Week 3：选题分析 + 风格画像 + 知识库

#### 选题分析 Skills

```
7. 选题归类 Skill (topic_classifier)
   ├── 输入：内容列表
   ├── 功能：基于预定义的选题树（7大类+子类）自动分类
   ├── 方法：LLM + 关键词匹配混合
   └── 输出：每条内容的分类标签

8. 选题评分 Skill (topic_scorer) — 简化版
   ├── 输入：候选选题（基于竞品热点 + 赛道趋势）
   ├── 评分维度（MVP 简化为 3 维）：
   │   ├── 热度（搜索指数/竞品表现）
   │   ├── 历史匹配（博主同类选题历史表现）
   │   └── 差异化（竞品覆盖度）
   └── 输出：评分排序的选题列表 TOP 15
```

#### 风格引擎

```
9. 风格分析 Skill (style_analyzer)
   ├── 输入：博主全部历史内容
   ├── 分析维度：
   │   ├── 标题模式（数字开头/疑问句/emoji开头 的比例）
   │   ├── 开头模式（前50字的常用句式）
   │   ├── 段落长度分布
   │   ├── 高频词汇/短语
   │   ├── emoji 使用频率和偏好
   │   ├── 结尾/CTA 模式
   │   └── 互动元素（提问/投票/引导评论）
   ├── 输出：风格画像 JSON（存入 style_profiles 表）
   └── 定期更新：每周重新分析一次

10. 风格模板库（硬编码初始版）
    ├── 小红书「院校介绍」模板
    ├── 小红书「申请攻略」模板
    ├── 小红书「生活指南」模板
    ├── 小红书「费用盘点」模板
    ├── 小红书「政策解读」模板
    └── 小红书「热点时效」模板
```

#### 知识库

```
11. 知识库初始化
    ├── 数据结构设计（院校/专业/费用/政策 4 张核心表）
    ├── 手动录入 50 条核心数据：
    │   ├── NUS/NTU/SMU 基本信息各 1 条 = 3 条
    │   ├── 热门专业信息 15 条（CS/商科/工程等）
    │   ├── 学费信息 10 条
    │   ├── 申请时间线 5 条
    │   ├── 签证政策 5 条
    │   ├── 生活成本 5 条
    │   └── 就业数据 7 条
    └── 向量化存入 ChromaDB

12. 知识库管理 Skill (knowledge_mgr)
    ├── CRUD 操作
    ├── 全文搜索 + 语义搜索
    └── 知识关联查询
```

#### Web 页面

```
13. 选题中心页面
    ├── 选题日历视图（按周展示）
    ├── 选题列表（卡片式，含评分、分类标签）
    ├── 选题详情（来源分析、竞品对标、推荐理由）
    ├── 手动添加/编辑选题
    └── 选题审批流程（AI 推荐 → 人工确认）

14. 风格画像页面
    ├── 风格画像展示（雷达图/词云/统计图）
    ├── 历史风格变化趋势
    ├── 风格参数调整面板
    └── 风格测试（输入内容 → 风格匹配度评分）

15. 知识库页面
    ├── 知识条目列表（分类筛选 + 搜索）
    ├── 知识条目详情/编辑
    ├── 添加新条目（表单）
    ├── 批量导入（CSV/Excel）
    └── 知识图谱可视化（简化版）
```

---

### Week 4：内容生成 + 质量评分

#### 内容生成 Skills

```
16. 内容生成 Skill (content_writer)
    ├── 输入：选题 + 风格画像 + 知识库素材 + 参考内容
    ├── 生成流程：
    │   ├── Step 1: RAG 检索相关知识条目
    │   ├── Step 2: 检索博主同类历史爆款 2-3 篇
    │   ├── Step 3: 选择对应的内容模板
    │   ├── Step 4: 调用 LLM（Claude）生成初稿
    │   ├── Step 5: 风格校准（对比风格画像，调整措辞）
    │   └── Step 6: SEO 优化（标题/标签）
    ├── 输出：
    │   ├── 标题（3 个候选）
    │   ├── 正文
    │   ├── 标签列表
    │   └── 封面图提示词
    └── 存入 generated_contents 表

17. 封面图生成 Skill (image_composer)
    ├── 输入：标题 + 内容摘要
    ├── 方法：调用 DALL-E 3 / Stable Diffusion
    ├── 生成 3 张候选封面图
    └── 输出：图片 URL

18. 质量评分 Skill (quality_scorer) — 简化版
    ├── 输入：生成的内容
    ├── 评分维度（MVP 3 维）：
    │   ├── 风格匹配度（与博主历史对比）
    │   ├── 事实准确性（与知识库交叉验证）
    │   └── 可读性（段落长度/逻辑/emoji使用）
    ├── 输出：总分 + 各维度分数 + 改进建议
    └── 阈值：< 70 打回重生成，70-80 人工审核，> 80 自动通过
```

#### Web 页面

```
19. 内容工坊页面
    ├── 内容生成面板
    │   ├── 选择选题 → 一键生成
    │   ├── 生成进度实时展示
    │   └── 生成结果预览（标题候选/正文/标签/封面图）
    ├── 内容编辑器
    │   ├── 富文本编辑（修改生成内容）
    │   ├── 风格匹配度实时检测
    │   ├── 知识库事实高亮标注
    │   └── 标题 A/B 测试面板
    ├── 内容列表
    │   ├── 状态筛选（草稿/待审/已通过/已发布/已打回）
    │   ├── 质量评分排序
    │   └── 批量操作
    └── 内容详情
        ├── 原始生成内容 vs 修改后内容 diff
        ├── 评分详情
        └── 生成参数（用了哪些知识/参考了哪几篇）
```

---

### Week 5：自动发布 + 数据回收

#### 发布 Skills

```
20. 小红书发布 Skill (xhs_publisher)
    ├── 输入：审核通过的内容 + 封面图 + 发布时间
    ├── 发布流程：
    │   ├── Playwright 打开小红书创作者中心
    │   ├── 上传封面图
    │   ├── 填入标题
    │   ├── 填入正文
    │   ├── 添加标签
    │   ├── 设置定时发布（或立即发布）
    │   └── 确认发布
    ├── 输出：发布状态 + 内容 URL
    └── 异常处理：发布失败重试（最多3次）+ 通知

21. 发布时间优化 Skill (timing_optimizer) — 简化版
    ├── 输入：历史发布数据 + 互动数据
    ├── 分析：不同时间段的平均互动率
    └── 输出：推荐的发布时间段
```

#### 数据回收

```
22. 数据回收 Skill (metrics_collector)
    ├── 定时采集已发布内容的互动数据
    ├── 数据：曝光量/点赞/收藏/评论数/涨粉数
    ├── 存入 metrics 表
    └── 触发条件：发布后 1h/6h/24h/72h 各采集一次
```

#### Web 页面

```
23. 发布管理页面
    ├── 发布日历（日视图/周视图）
    ├── 发布队列（待发布/发布中/已完成/失败）
    ├── 定时发布设置
    ├── 发布结果追踪（互动数据实时更新）
    └── 发布失败日志

24. 数据看板页面（仪表盘）
    ├── 核心指标卡片
    │   ├── 本周发布数
    │   ├── 自动生成率
    │   ├── 平均质量分
    │   ├── 平均互动率
    │   └── 环比变化
    ├── 互动趋势图（7天/30天）
    ├── 选题表现排名
    ├── 发布时间 vs 互动率分析
    └── 内容质量分布图
```

---

### Week 6：集成测试 + 优化 + 部署

```
25. 端到端集成测试
    ├── 采集 → 分析 → 选题 → 生成 → 审核 → 发布 → 回收 完整链路
    ├── 异常场景测试（LLM 超时、发布失败、数据异常）
    └── 边界情况测试（空内容、超长内容、敏感词）

26. 体验优化
    ├── 生成速度优化（并行/缓存）
    ├── 前端交互优化（loading状态/错误提示）
    └── 移动端适配（响应式）

27. 部署
    ├── Docker Compose 一键部署
    ├── 环境变量配置
    ├── 数据备份脚本
    └── 使用文档
```

---

## 四、数据库 Schema 详细设计

### contents（采集内容表）

```sql
CREATE TABLE contents (
    id          SERIAL PRIMARY KEY,
    platform    VARCHAR(20) NOT NULL,        -- 'xiaohongshu' | 'douyin' | 'wechat'
    source_type VARCHAR(20) NOT NULL,        -- 'self' | 'competitor' | 'trending'
    source_id   VARCHAR(100),                -- 来源账号ID
    source_name VARCHAR(200),                -- 来源账号名称
    title       TEXT,
    body        TEXT,
    tags        JSONB,                       -- ['标签1', '标签2']
    images      JSONB,                       -- ['url1', 'url2']
    category    VARCHAR(50),                 -- 选题分类
    sub_category VARCHAR(50),                -- 子分类
    
    -- 互动数据
    likes       INTEGER DEFAULT 0,
    collects    INTEGER DEFAULT 0,
    comments    INTEGER DEFAULT 0,
    shares      INTEGER DEFAULT 0,
    views       INTEGER DEFAULT 0,
    
    -- 元数据
    published_at TIMESTAMP WITH TIME ZONE,
    crawled_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_hash VARCHAR(64) UNIQUE,         -- 去重用
    
    -- 向量索引
    embedding_id VARCHAR(100)                -- ChromaDB 中的 ID
);

CREATE INDEX idx_contents_platform ON contents(platform);
CREATE INDEX idx_contents_source_type ON contents(source_type);
CREATE INDEX idx_contents_category ON contents(category);
CREATE INDEX idx_contents_published_at ON contents(published_at);
```

### topics（选题表）

```sql
CREATE TABLE topics (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    category    VARCHAR(50),
    sub_category VARCHAR(50),
    description TEXT,
    
    -- 评分
    score       FLOAT,                       -- 综合得分
    score_detail JSONB,                      -- {"hot": 85, "history": 78, "diff": 90}
    
    -- 来源
    source      VARCHAR(50),                 -- 'ai_recommended' | 'manual' | 'trending'
    source_ref  JSONB,                       -- 来源引用（竞品内容/热搜数据）
    
    -- 状态
    status      VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
    
    -- 排期
    scheduled_date DATE,
    scheduled_time TIME,
    platform    VARCHAR(20),
    
    -- 关联
    content_id  INTEGER REFERENCES generated_contents(id),
    
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### knowledge（知识库表）

```sql
CREATE TABLE knowledge (
    id          SERIAL PRIMARY KEY,
    category    VARCHAR(50) NOT NULL,        -- 'institution' | 'program' | 'cost' | 'policy' | 'living' | 'application'
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    tags        JSONB,
    
    -- 结构化数据
    structured_data JSONB,                   -- 类型特有字段（学费/排名/要求等）
    
    -- 关联
    related_ids INTEGER[],                   -- 关联的其他知识条目
    
    -- 来源
    source      VARCHAR(200),                -- 数据来源（官网/手动录入/自动采集）
    verified    BOOLEAN DEFAULT FALSE,       -- 是否已验证
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 向量索引
    embedding_id VARCHAR(100)
);

CREATE INDEX idx_knowledge_category ON knowledge(category);
CREATE INDEX idx_knowledge_tags ON knowledge USING GIN(tags);
```

### generated_contents（生成内容表）

```sql
CREATE TABLE generated_contents (
    id          SERIAL PRIMARY KEY,
    topic_id    INTEGER REFERENCES topics(id),
    
    -- 生成内容
    title_candidates JSONB,                  -- ['标题1', '标题2', '标题3']
    selected_title TEXT,
    body        TEXT,
    tags        JSONB,
    cover_image_urls JSONB,                  -- ['url1', 'url2', 'url3']
    selected_cover_url TEXT,
    
    -- 生成参数
    prompt_used TEXT,                        -- 使用的 Prompt
    knowledge_refs INTEGER[],                -- 引用的知识条目 ID
    reference_contents INTEGER[],            -- 参考的历史内容 ID
    style_profile_id INTEGER,                -- 使用的风格画像版本
    
    -- 评分
    quality_score FLOAT,
    quality_detail JSONB,                    -- {"style": 85, "accuracy": 90, "readability": 82}
    quality_feedback TEXT,                   -- 改进建议
    
    -- 状态
    status      VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'reviewing' | 'approved' | 'published' | 'rejected'
    review_note TEXT,                        -- 审核备注
    
    -- 发布信息
    platform    VARCHAR(20),
    published_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### style_profiles（风格画像表）

```sql
CREATE TABLE style_profiles (
    id          SERIAL PRIMARY KEY,
    version     INTEGER NOT NULL,
    
    -- 风格画像数据
    profile_data JSONB NOT NULL,             -- 完整的风格画像JSON
    
    -- 分析样本
    sample_count INTEGER,                    -- 分析了多少条内容
    sample_date_range TSTZRANGE,             -- 样本时间范围
    
    -- 效果
    avg_style_match FLOAT,                   -- 平均风格匹配度
    
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### metrics（表现数据表）

```sql
CREATE TABLE metrics (
    id          SERIAL PRIMARY KEY,
    content_id  INTEGER REFERENCES generated_contents(id),
    platform    VARCHAR(20),
    
    -- 互动数据
    likes       INTEGER DEFAULT 0,
    collects    INTEGER DEFAULT 0,
    comments    INTEGER DEFAULT 0,
    shares      INTEGER DEFAULT 0,
    views       INTEGER DEFAULT 0,
    followers_gained INTEGER DEFAULT 0,
    
    -- 采集时间
    hours_since_publish FLOAT,               -- 发布后多少小时的数据
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_content_id ON metrics(content_id);
CREATE INDEX idx_metrics_collected_at ON metrics(collected_at);
```

---

## 五、Web 管理后台页面设计

### 5.1 页面清单

| 页面 | 路由 | 功能 | 优先级 |
|------|------|------|--------|
| 仪表盘 | `/hermes/dashboard` | 核心指标、趋势图、今日排期 | P0 |
| 选题中心 | `/hermes/topics` | 选题日历、选题列表、审批 | P0 |
| 内容工坊 | `/hermes/content` | 内容生成、编辑、审核 | P0 |
| 知识库 | `/hermes/knowledge` | 知识条目管理、搜索 | P0 |
| 数据采集 | `/hermes/collection` | 采集任务、采集结果 | P0 |
| 发布管理 | `/hermes/publishing` | 发布队列、发布结果 | P0 |
| 风格画像 | `/hermes/style` | 风格分析、模板管理 | P1 |
| 数据分析 | `/hermes/analytics` | 深度分析报告 | P1 |

### 5.2 页面详细设计

#### 仪表盘 `/hermes/dashboard`

```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 仪表盘                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │本周发布   │ │自动率     │ │平均质量分 │ │平均互动率 │          │
│  │   8/12   │ │  75%     │ │  83.2    │ │  4.7%    │          │
│  │ ▲+2      │ │ ▲+5%     │ │ ▲+1.3    │ │ ▲+0.3%   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  📋 今日排期                              📊 互动趋势 (7天)     │
│  ┌─────────────────────────────┐         ┌──────────────────┐  │
│  │ ⏰ 12:00  NUS CS解析  ✅已发布│         │    📈            │  │
│  │ ⏰ 18:00  租房避坑    🟡待发布│         │   /    \         │  │
│  │ ⏰ 20:00  EP新政     🔵生成中│         │  /      \   /    │  │
│  └─────────────────────────────┘         └──────────────────┘  │
│                                                                 │
│  🔥 热门选题 TOP 5                       📝 待审核内容           │
│  ┌─────────────────────────────┐         ┌──────────────────┐  │
│  │ 1. NUS 2026申请时间线  (92分)│         │ 3 篇内容待审核    │  │
│  │ 2. 新加坡租房避坑指南  (88分)│         │ 最高分：85分      │  │
│  │ 3. EP签证新政解读     (85分)│         │ 最低分：72分      │  │
│  │ 4. NTU vs NUS 商科对比 (83分)│        │                   │  │
│  │ 5. 雅思7分备考经验    (81分)│         │ [去审核 →]       │  │
│  └─────────────────────────────┘         └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 选题中心 `/hermes/topics`

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 选题中心                                                     │
│  [选题日历] [选题列表] [选题分析]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  选题日历视图（当前周）：                                        │
│  ┌────────┬────────┬────────┬────────┬────────┬────────┬──────┐│
│  │  周一   │  周二   │  周三   │  周四   │  周五   │  周六   │ 周日││
│  ├────────┼────────┼────────┼────────┼────────┼────────┼─────┤│
│  │NUS CS  │2026申请 │新加坡   │雅思7分 │EP新政  │NTU    │Q&A  ││
│  │解析    │时间线   │租房避坑 │经验贴  │解读    │Vlog   │合集  ││
│  │92分    │88分     │85分    │83分    │81分    │78分   │75分 ││
│  │✅已发布 │🔵生成中 │⏳待生成 │⏳待生成 │⏳待生成 │⏳待生成│⏳   ││
│  └────────┴────────┴────────┴────────┴────────┴────────┴─────┘│
│                                                                 │
│  [🤖 AI推荐新选题]  [➕ 手动添加选题]                             │
│                                                                 │
│  ──────────────────────────────────────────────────────         │
│  选题列表：                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🏫 NUS CS专业到底值不值得读？5个维度给你讲透！      92分 │  │
│  │    来源: AI推荐 | 院校相关-专业解析 | 竞品3篇/缺口大    │  │
│  │    [生成内容] [查看分析] [替换] [取消]                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ 📋 2026新加坡留学申请完整时间线                  88分  │  │
│  │    来源: AI推荐 | 申请攻略-时间规划 | 热度上升中        │  │
│  │    [生成内容] [查看分析] [替换] [取消]                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 内容工坊 `/hermes/content`

```
┌─────────────────────────────────────────────────────────────────┐
│  ✍️ 内容工坊                                                     │
│  [生成] [编辑] [审核] [已完成]                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  内容编辑器：                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 选题：NUS CS专业到底值不值得读？                           │ │
│  │                                                           │ │
│  │ 标题候选：                                                │ │
│  │ [A] 🔥 NUS计算机科学到底值不值得读？5个维度给你讲透！       │ │
│  │ [B] 💻 NUS CS申请全攻略｜过来人告诉你真实体验              │ │
│  │ [C] 🎓 去NUS读CS是什么体验？就业/费用/录取难度全解析      │ │
│  │                                                           │ │
│  │ 正文：                                                    │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ 姐妹们！今天来聊聊大家问得最多的 NUS 计算机科学 🎓    │  │ │
│  │ │                                                       │  │ │
│  │ │ 作为一个过来人，我把所有想知道的都整理好了👇            │  │ │
│  │ │                                                       │  │ │
│  │ │ 📍 专业基本信息                                       │  │ │
│  │ │ NUS CS 是新加坡排名第一的计算机项目...                 │  │ │
│  │ │ [全文长度: 856字 / 建议范围: 800-1200字]              │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │ 标签：#NUS #计算机科学 #新加坡留学 #留学申请 #CS专业       │ │
│  │                                                           │ │
│  │ 封面图：                                                  │ │
│  │ [图1🟢] [图2] [图3]  [重新生成]                          │ │
│  │                                                           │ │
│  │ 质量评分：83/100                                          │ │
│  │ ├── 风格匹配度: 87 ✅                                     │ │
│  │ ├── 事实准确性: 82 ✅                                     │ │
│  │ └── 可读性: 79 ⚠️ (建议缩短第3段)                         │ │
│  │                                                           │ │
│  │ [💾 保存草稿] [✅ 提交审核] [🔄 重新生成] [📋 知识引用]    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、API 设计

### 6.1 数据采集 API

```
GET    /api/hermes/collection/tasks          获取采集任务列表
POST   /api/hermes/collection/tasks          创建采集任务
POST   /api/hermes/collection/tasks/:id/run  手动执行采集任务
GET    /api/hermes/collection/contents       获取采集内容列表
GET    /api/hermes/collection/contents/:id   获取内容详情
DELETE /api/hermes/collection/contents/:id   删除内容
GET    /api/hermes/collection/competitors    获取竞品列表
POST   /api/hermes/collection/competitors    添加竞品
DELETE /api/hermes/collection/competitors/:id 删除竞品
```

### 6.2 选题 API

```
GET    /api/hermes/topics                    获取选题列表（支持筛选/排序）
POST   /api/hermes/topics                    手动创建选题
POST   /api/hermes/topics/recommend          AI推荐选题
GET    /api/hermes/topics/:id                获取选题详情
PUT    /api/hermes/topics/:id                更新选题
PUT    /api/hermes/topics/:id/approve        审批选题
DELETE /api/hermes/topics/:id                删除选题
GET    /api/hermes/topics/calendar           获取选题日历
```

### 6.3 内容生成 API

```
POST   /api/hermes/content/generate          生成内容（传入topicId）
POST   /api/hermes/content/generate-batch    批量生成
GET    /api/hermes/content                   获取内容列表
GET    /api/hermes/content/:id               获取内容详情
PUT    /api/hermes/content/:id               更新内容（编辑后保存）
POST   /api/hermes/content/:id/score         重新评分
PUT    /api/hermes/content/:id/approve       审核通过
PUT    /api/hermes/content/:id/reject        审核打回
POST   /api/hermes/content/:id/regenerate    重新生成
```

### 6.4 知识库 API

```
GET    /api/hermes/knowledge                 获取知识列表（支持分类/搜索）
POST   /api/hermes/knowledge                 创建知识条目
GET    /api/hermes/knowledge/:id             获取知识详情
PUT    /api/hermes/knowledge/:id             更新知识条目
DELETE /api/hermes/knowledge/:id             删除知识条目
POST   /api/hermes/knowledge/import          批量导入（CSV/JSON）
POST   /api/hermes/knowledge/search          语义搜索
GET    /api/hermes/knowledge/categories      获取分类列表
```

### 6.5 发布 API

```
GET    /api/hermes/publishing/queue          获取发布队列
POST   /api/hermes/publishing/publish        发布内容（传入contentId）
POST   /api/hermes/publishing/schedule       定时发布
POST   /api/hermes/publishing/cancel/:id     取消发布
GET    /api/hermes/publishing/history        发布历史
GET    /api/hermes/publishing/timing         获取推荐发布时间
```

### 6.6 风格 API

```
GET    /api/hermes/style/profile             获取当前风格画像
POST   /api/hermes/style/analyze             重新分析风格
POST   /api/hermes/style/test               测试风格匹配度
GET    /api/hermes/style/templates           获取风格模板列表
PUT    /api/hermes/style/templates/:id       更新模板
```

### 6.7 数据分析 API

```
GET    /api/hermes/analytics/dashboard       仪表盘数据
GET    /api/hermes/analytics/trends          互动趋势
GET    /api/hermes/analytics/topics          选题表现分析
GET    /api/hermes/analytics/timing          发布时间分析
GET    /api/hermes/analytics/style           风格效果分析
```

### 6.8 指标 API

```
GET    /api/hermes/metrics/:contentId        获取内容指标
POST   /api/hermes/metrics/collect           手动触发指标采集
```

---

## 七、技术实现细节

### 7.1 LLM 调用封装

```typescript
// 服务端 LLM 调用封装
interface LLMService {
  // 内容生成
  generateContent(params: {
    topic: Topic;
    styleProfile: StyleProfile;
    knowledgeRefs: Knowledge[];
    referenceContents: Content[];
    template: ContentTemplate;
  }): Promise<GeneratedContent>;

  // 风格分析
  analyzeStyle(contents: Content[]): Promise<StyleProfile>;

  // 选题评分
  scoreTopics(topics: Topic[], history: Content[]): Promise<ScoredTopic[]>;

  // 质量评分
  scoreContent(content: GeneratedContent, styleProfile: StyleProfile): Promise<QualityScore>;
}
```

### 7.2 采集任务调度

```typescript
// Celery 任务定义（Python Skills）
// 或使用 Node.js 的 bull/bullmq

// 每日采集任务
@cron('0 2 * * *')
async function dailyXhsCrawl() {
  // 1. 采集博主自有内容
  await crawlBloggerContent(bloggerId);
  // 2. 采集竞品内容
  for (const competitor of competitors) {
    await crawlCompetitorContent(competitor.id);
  }
  // 3. 触发选题更新
  await refreshTopicRecommendations();
}

// 指标回收任务
@cron('0 */4 * * *')
async function metricsCollection() {
  const recentPublished = await getRecentlyPublished(72); // 72小时内发布的
  for (const content of recentPublished) {
    await collectMetrics(content.id);
  }
}
```

### 7.3 向量化与 RAG

```typescript
// 知识库向量化
async function indexKnowledge(item: Knowledge) {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: `${item.title} ${item.content}`,
  });
  
  await chromadb.collection('knowledge').add({
    ids: [String(item.id)],
    embeddings: [embedding.data[0].embedding],
    metadatas: [{ category: item.category }],
    documents: [`${item.title}\n${item.content}`],
  });
}

// RAG 检索
async function retrieveKnowledge(query: string, topK = 5) {
  const results = await chromadb.collection('knowledge').query({
    queryTexts: [query],
    nResults: topK,
  });
  
  return results.documents[0].map((doc, i) => ({
    content: doc,
    metadata: results.metadatas[0][i],
    distance: results.distances[0][i],
  }));
}
```

---

## 八、部署架构

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8648:8648"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/sg_content
      - REDIS_URL=redis://redis:6379
      - CHROMA_URL=http://chromadb:8000
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
      - chromadb

  worker:
    build: .
    command: npm run worker
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/sg_content
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: sg_content
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  pg_data:
  chroma_data:
```

---

## 九、里程碑与交付物

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|---------|
| M1: 采集可用 | Week 2 | 采集引擎 + Web采集页面 | 能采集博主+竞品小红书内容，Web页面能查看 |
| M2: 分析可用 | Week 3 | 选题引擎 + 风格画像 + 知识库 | 能自动推荐选题、展示风格画像、管理知识 |
| M3: 生成可用 | Week 4 | 内容生成 + 质量评分 + Web编辑器 | 能生成小红书图文内容，质量评分>75 |
| M4: 发布可用 | Week 5 | 自动发布 + 数据回收 + 数据看板 | 能自动发布到小红书，数据能回收展示 |
| M5: MVP完成 | Week 6 | 完整系统 + 部署 + 文档 | 全链路跑通，Docker一键部署 |

---

## 十、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| 小红书反爬升级 | 采集中断 | 准备多个采集方案（RPA/API/第三方数据平台） |
| LLM 生成质量不稳定 | 内容质量波动 | 多轮评分 + 人工兜底 + Prompt 持续优化 |
| 风格匹配度不够 | 内容不像博主 | 增加参考样本数量 + 细化风格描述 + 更多模板 |
| 发布接口变动 | 发布失败 | 多种发布方式（RPA/API）互为备份 |
| 知识库数据过时 | 内容准确性 | 设置数据有效期 + 定期更新 + 事实核查 |
