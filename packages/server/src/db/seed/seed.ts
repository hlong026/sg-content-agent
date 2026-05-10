import { getDb } from '../database'
import { logger } from '../../services/logger'

export function seedData() {
  const db = getDb()

  // Check if already seeded
  const count = (db.prepare('SELECT COUNT(*) as c FROM knowledge').get() as any).c
  if (count > 0) {
    logger.info('Database already seeded, skipping')
    return
  }

  logger.info('Seeding database with initial data...')

  // ─── Knowledge ──────────────────────────────────────────────
  const knowledgeItems = [
    { category: 'institution', title: 'NUS - 新加坡国立大学', content: '新加坡国立大学（National University of Singapore），2025年QS世界大学排名第8位。位于肯特岗，占地150公顷。设有16个学院，知名专业：计算机科学、工程、商科、法学、医学。本科申请要求：高考一本线以上+面试，或A-Level AAA以上。硕士要求：985/211优先，GPA 3.0+，雅思6.5+/托福92+。', tags: '["NUS","新加坡","大学","QS排名"]', source: 'manual' },
    { category: 'institution', title: 'NTU - 南洋理工大学', content: '南洋理工大学（Nanyang Technological University），2025年QS排名第15位。位于云南园，占地200公顷。知名专业：工程、商科、传媒、人工智能。本科申请：高考一本线以上，部分专业需要面试。硕士：GPA 3.0+，雅思6.5+，部分专业要求GMAT/GRE。', tags: '["NTU","南洋理工","大学"]', source: 'manual' },
    { category: 'institution', title: 'SMU - 新加坡管理大学', content: '新加坡管理大学（Singapore Management University），商科和社科类强校。位于市中心。教学模式参考美国沃顿商学院，注重案例教学和团队协作。本科录取要求：A-Level优异或高考一本线以上，需要面试。知名专业：会计、金融、经济、法律、信息系统。', tags: '["SMU","管理大学","商科"]', source: 'manual' },
    { category: 'program', title: 'NUS 计算机科学本科', content: 'NUS计算机科学（Computer Science）是该校最热门专业之一。学制4年，每年招生约200人（含国际学生）。课程涵盖：算法、数据结构、操作系统、人工智能、机器学习、软件工程等。毕业要求：完成核心课程+选修+项目实习。就业率约95%，平均起薪5000-6000新币/月。', tags: '["NUS","CS","计算机","本科"]', source: 'manual' },
    { category: 'program', title: 'NUS 商科硕士', content: 'NUS商学院提供MBA、MSc in Finance、MSc in Marketing等多个硕士项目。MBA学制17个月，学费约10万新币。MSc项目学制12-15个月，学费约5-7万新币。申请要求：本科学历+3年工作经验（MBA），GMAT/GRE成绩，雅思7.0+。', tags: '["NUS","商科","硕士","MBA"]', source: 'manual' },
    { category: 'costs', title: '新加坡留学费用总览（2025）', content: '学费：本科国际生25,000-40,000新币/年（公立大学），硕士35,000-55,000新币/项目。生活费：每月约1,500-2,500新币。住宿：校内宿舍500-800新币/月，校外租房800-1,500新币/月。餐饮：每月约400-600新币。交通：地铁公交月卡约120新币。总计：每年约35-50万人民币。', tags: '["费用","学费","生活费","总览"]', source: 'manual' },
    { category: 'costs', title: '新加坡留学奖学金', content: '1. MOE学费减免（Tuition Grant）：政府资助，学费减免约50-70%，需签3年工作协议。2. ASEAN奖学金：全额奖学金，含学费+生活费。3. NUS/NTU研究奖学金：硕博项目，全额学费减免+月津贴2200-2700新币。4. 企业奖学金：如星展银行、淡马锡等企业提供的奖学金。', tags: '["奖学金","MOE","资助"]', source: 'manual' },
    { category: 'application', title: '2026申请时间线', content: '8月-10月：准备语言成绩（雅思/托福），整理申请材料。10月-12月：网申开放，提交申请（NUS/NTU多数项目截止日期为1-2月）。1月-3月：面试阶段。3月-5月：录取结果公布。5月-7月：办理学生签证（Student Pass），预定宿舍/租房。8月：开学。', tags: '["申请","时间线","2026"]', source: 'manual' },
    { category: 'application', title: '新加坡留学申请材料清单', content: '1. 成绩单（中英文公证）2. 毕业证/学位证或在读证明 3. 语言成绩（雅思/托福/PET）4. 个人陈述（PS）800-1000字 5. 推荐信2封 6. 简历CV 7. 护照复印件 8. 财务证明 9. 作品集（设计/建筑等专业）10. GMAT/GRE（部分商科/研究型项目）', tags: '["申请","材料","清单"]', source: 'manual' },
    { category: 'policies', title: '新加坡学生签证（Student Pass）', content: '所有国际学生需要申请Student Pass。通过学校在线系统提交申请（SOLAR系统）。处理时间：2-4周。所需材料：录取通知书、护照、照片、财务证明、体检报告。签证有效期：覆盖整个学习期间。注意：持Student Pass每周可打工16小时。', tags: '["签证","Student Pass","政策"]', source: 'manual' },
    { category: 'policies', title: '新加坡EP就业准证（2025新政）', content: 'EP（Employment Pass）是新加坡的工作签证。2025年新政：最低薪资门槛从5000新币提高到5300新币（金融行业5800新币）。COMPASS框架评估：薪资、学历、企业外籍员工比例、国籍多样性等维度。对留学生利好：NUS/NTU毕业+本地工作=加分项。毕业后可申请1年LTVP寻找工作。', tags: '["EP","工作签证","政策","2025"]', source: 'manual' },
    { category: 'living', title: '新加坡租房攻略', content: '区域选择：1. 西部（Clementi/Jurong）：靠近NUS，房租较低，800-1200新币/月（合租）。2. 北部（Woodlands）：安静便宜，但通勤远。3. 东部（Tampines/Pasir Ris）：靠近机场，生活便利。4. 市中心（Queenstown/Buona Vista）：交通方便但贵。租房类型：HDB组屋（600-1200新币/月），公寓（1200-2500新币/月）。注意：需确认是否允许外国人居住，签合同前看房。', tags: '["租房","住宿","生活"]', source: 'manual' },
    { category: 'career', title: '新加坡留学就业前景', content: 'NUS/NTU毕业生就业率约90%以上（6个月内找到工作）。平均起薪：本科4000-5500新币/月，硕士5000-7000新币/月。热门就业行业：金融、科技、咨询、制造业。主要雇主：Grab、Shopee、DBS、新加坡政府、Google、Meta新加坡等。PR申请：工作后6个月-2年可申请，NUS/NTU学历是加分项。', tags: '["就业","薪资","PR"]', source: 'manual' },
    { category: 'living', title: '新加坡日常消费指南', content: '餐饮：食阁3-6新币/餐，餐厅15-30新币/餐。超市：NTUC FairPrice最实惠。交通：EZ-Link卡，地铁1-2新币/程，月卡120新币。通讯：手机套餐20-50新币/月。医疗保险：学校提供基础保险，建议购买额外商业保险。银行：DBS/POSB开户最方便，学生即可开户。', tags: '["消费","生活","日常"]', source: 'manual' },
  ]

  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge (category, title, content, tags, source, verified)
    VALUES (?, ?, ?, ?, ?, 1)
  `)

  for (const item of knowledgeItems) {
    insertKnowledge.run(item.category, item.title, item.content, item.tags, item.source)
  }

  // ─── Sample collected contents ──────────────────────────────
  const contents = [
    { platform: 'xiaohongshu', source_type: 'self', source_name: '留学博主', title: '新加坡留学第一年踩过的坑！后悔没早知道😭', body: '姐妹们！来新加坡留学一年了，真的有好多话想说！今天把我踩过的坑都整理出来，希望对你们有帮助👇\n\n1️⃣ 租房一定要提前！\n我8月开学，7月才开始找房子，结果好房子都被抢光了。建议至少提前2-3个月开始看房。\n\n2️⃣ 食堂和食阁不一样\n学校食堂便宜（3-5新币），外面的食阁贵一些。学会做饭可以省很多！\n\n3️⃣ 交通卡办EZ-Link\n不要每次买单程票，办一张EZ-Link卡方便又便宜。\n\n4️⃣ 打工时间有限制\nStudent Pass每周只能打工16小时，别超时了！\n\n5️⃣ PR不是毕业就能拿\n至少要工作半年以上才能申请，别被中介忽悠了。\n\n你们还有什么想了解的？评论区见！💬', category: '生活指南', likes: 5600, collects: 3200, comments: 480, views: 45000 },
    { platform: 'xiaohongshu', source_type: 'self', source_name: '留学博主', title: 'NUS CS申请全攻略｜从准备到录取的真实经历🎓', body: '姐妹们！今天来聊聊NUS计算机科学的申请经验！作为一个过来人，把所有细节都整理好了👇\n\n📍 我的基本情况\n985 CS专业，GPA 3.7，雅思7.0，两段实习，一个省赛获奖\n\n📋 申请时间线\n▪️ 3月：开始准备雅思\n▪️ 6月：出雅思成绩\n▪️ 8月：准备PS和推荐信\n▪️ 10月：网申开放，提交申请\n▪️ 12月：收到面试通知\n▪️ 2月：收到offer！🎉\n\n💡 核心建议\n1. GPA很重要！至少3.3以上\n2. 雅思早点考，7.0以上有竞争力\n3. PS要突出你为什么选择NUS，不要泛泛而谈\n4. 推荐信找了解你的老师写\n\n💰 费用\n学费约38,000新币/年，申请了MOE减免后约17,000新币/年\n\n有问题评论区问我！记得收藏～', category: '院校相关', likes: 8900, collects: 5600, comments: 720, views: 78000 },
    { platform: 'xiaohongshu', source_type: 'self', source_name: '留学博主', title: '新加坡留学生每月花多少？真实账单大公开💰', body: '姐妹们最关心的问题来了——在新加坡留学到底要花多少钱？\n\n📍 我的基本情况\nNUS大三，校外合租，偶尔做饭\n\n💰 每月固定支出\n▪️ 房租：1,000新币（合租公寓）\n▪️ 餐饮：600新币（一半做饭一半外面吃）\n▪️ 交通：120新币（月卡）\n▪️ 手机：25新币\n▪️ 日常用品：100新币\n\n总计：约1,845新币/月 ≈ 10,000人民币/月\n\n💡 省钱tips\n1. 学会做饭！每月能省300-400新币\n2. 用学生优惠（电影、餐厅都有折扣）\n3. 买二手教材（NTUC二手群超多）\n4. 办POSB银行卡，ATM取款免费\n\n一年总花费（含学费）：约30-35万人民币\n\n这个数字你接受吗？评论区聊聊～', category: '费用相关', likes: 7200, collects: 4100, comments: 560, views: 62000 },
    { platform: 'xiaohongshu', source_type: 'competitor', source_name: '留学小助手', title: '新加坡国立大学和南洋理工大学怎么选？', body: 'NUS vs NTU 怎么选？这两所学校都是世界前20，但各有特色。从排名、专业、校园生活、就业四个维度帮你分析...', category: '院校相关', likes: 3400, collects: 2100, comments: 320, views: 28000 },
    { platform: 'xiaohongshu', source_type: 'competitor', source_name: '新加坡留学圈', title: '2025新加坡留学最新政策变化汇总', body: '2025年新加坡留学政策有哪些变化？EP签证、Student Pass、PR申请...一次性帮你讲清楚...', category: '政策解读', likes: 4100, collects: 2800, comments: 380, views: 35000 },
    { platform: 'xiaohongshu', source_type: 'competitor', source_name: '狮城留学生', title: '新加坡打工实习经验分享', body: '在新加坡留学期间如何找实习？分享我的个人经验，从准备简历到拿到offer的全过程...', category: '就业发展', likes: 2800, collects: 1600, comments: 250, views: 22000 },
  ]

  const insertContent = db.prepare(`
    INSERT INTO contents (platform, source_type, source_name, title, body, category, likes, collects, comments, views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const c of contents) {
    insertContent.run(c.platform, c.source_type, c.source_name, c.title, c.body, c.category, c.likes, c.collects, c.comments, c.views)
  }

  // ─── Sample topics ──────────────────────────────────────────
  const topics = [
    { title: 'NUS CS 专业深度解析：录取、费用、就业全攻略', category: '院校相关', sub_category: '专业解析', score: 92, score_detail: '{"hot":85,"history":95,"diff":96}', source: 'ai_recommended', status: 'approved', scheduled_date: '2026-05-12', scheduled_time: '12:00' },
    { title: '2026新加坡留学申请完整时间线（附每月清单）', category: '申请攻略', sub_category: '时间规划', score: 88, score_detail: '{"hot":90,"history":85,"diff":89}', source: 'ai_recommended', status: 'approved', scheduled_date: '2026-05-13', scheduled_time: '18:00' },
    { title: '新加坡租房终极避坑指南｜区域+价格全对比', category: '生活指南', sub_category: '租房', score: 85, score_detail: '{"hot":82,"history":88,"diff":85}', source: 'ai_recommended', status: 'draft', scheduled_date: '2026-05-14', scheduled_time: '12:00' },
    { title: 'EP签证2026新政策解读：留学生怎么办？', category: '政策解读', score: 83, score_detail: '{"hot":88,"history":78,"diff":83}', source: 'ai_recommended', status: 'draft' },
    { title: 'NTU vs NUS 商科怎么选？在读生真实对比', category: '院校相关', sub_category: '院校对比', score: 81, score_detail: '{"hot":75,"history":85,"diff":83}', source: 'ai_recommended', status: 'draft' },
  ]

  const insertTopic = db.prepare(`
    INSERT INTO topics (title, category, sub_category, score, score_detail, source, status, scheduled_date, scheduled_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const topicIds: number[] = []
  for (const t of topics) {
    const r = insertTopic.run(t.title, t.category, t.sub_category || null, t.score, t.score_detail, t.source, t.status, t.scheduled_date || null, t.scheduled_time || null)
    topicIds.push(Number(r.lastInsertRowid))
  }

  // ─── Sample generated content ───────────────────────────────
  db.prepare(`
    INSERT INTO generated_contents (topic_id, title_candidates, selected_title, body, tags, quality_score, quality_detail, quality_feedback, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    topicIds[0],
    '["🔥 NUS计算机科学到底值不值得读？5个维度给你讲透！","💻 NUS CS申请全攻略｜过来人告诉你真实体验","🎓 去NUS读CS是什么体验？就业/费用/录取难度全解析"]',
    '🔥 NUS计算机科学到底值不值得读？5个维度给你讲透！',
    '姐妹们！今天来聊聊大家问得最多的 NUS 计算机科学 🎓\n\n作为一个过来人，我把所有想知道的都整理好了👇\n\n📍 专业基本信息\nNUS CS 是新加坡排名第一的计算机项目，QS学科排名全球第6。每年招生约200人，其中国际学生约占30%。\n\n💰 费用明细\n▪️ 学费：38,000新币/年（国际生）\n▪️ MOE减免后：约17,000新币/年\n▪️ 生活费：每月约1,500-2,000新币\n\n📊 录取难度\n▪️ GPA建议：3.3+/4.0（约85+）\n▪️ 雅思：7.0+\n▪️ 竞争比：约10:1\n▪️ 面试：技术面+行为面\n\n💼 就业前景\n▪️ 毕业生就业率：95%+\n▪️ 平均起薪：5,000-6,000新币/月\n▪️ 热门去向：Grab, Shopee, Google, Meta\n\n✅ 适合人群\n1. 对编程有热情\n2. GPA较高的同学\n3. 愿意挑战高难度课程\n\n❌ 注意事项\n1. 课程强度大，每周coding量多\n2. 需要数学基础好\n3. 不适合想混日子的同学\n\n💡 过来人建议\n早点准备语言成绩，PS要突出你和NUS的匹配度。实习经历是加分项！\n\n你们还想了解什么？评论区告诉我！💬',
    '["NUS","计算机科学","新加坡留学","CS专业","留学申请"]',
    87,
    '{"style":89,"accuracy":88,"readability":84}',
    '风格匹配度很好，数据准确，建议在就业部分增加更多具体公司案例。',
    'approved'
  )

  db.prepare(`
    INSERT INTO generated_contents (topic_id, title_candidates, selected_title, body, tags, quality_score, quality_detail, quality_feedback, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    topicIds[1],
    '["📅 2026新加坡留学申请时间线｜每月该做什么全清楚","保姆级！2026新加坡留学申请完整日历📋","新加坡留学申请全流程｜从现在开始准备"]',
    '📅 2026新加坡留学申请时间线｜每月该做什么全清楚',
    '姐妹们！2026年想去新加坡留学的看过来！\n\n我把从现在开始到明年开学，每个月该做什么都整理好了👇\n\n📍 2025年6-8月 准备阶段\n▪️ 考出语言成绩（雅思/托福）\n▪️ 整理在校成绩，准备公证件\n▪️ 开始构思PS（个人陈述）\n\n📍 2025年9-10月 申请启动\n▪️ 注册网申账号\n▪️ 联系推荐人，确认推荐信\n▪️ 精修PS和CV\n\n📍 2025年11-12月 高峰期\n▪️ 提交所有申请\n▪️ 注意每个项目的截止日期\n▪️ 准备面试（部分专业需要）\n\n📍 2026年1-3月 等待+面试\n▪️ 参加面试\n▪️ 补交材料（如需要）\n\n📍 2026年4-5月 录取\n▪️ 收到offer！🎉\n▪️ 确认接受，缴纳留位费\n\n📍 2026年6-7月 出发准备\n▪️ 申请Student Pass\n▪️ 预定住宿\n▪️ 买机票\n\n📍 2026年8月 开学！\n\n每月的详细清单我做成图片了，记得收藏！📌\n\n#新加坡留学 #留学申请 #申请时间线 #NUS #NTU',
    '["新加坡留学","申请时间线","留学申请","2026"]',
    83,
    '{"style":85,"accuracy":82,"readability":82}',
    '时间线清晰实用，建议增加每月的具体deadline日期。',
    'reviewing'
  )

  logger.info(`Seeded: ${knowledgeItems.length} knowledge items, ${contents.length} contents, ${topics.length} topics`)
}
