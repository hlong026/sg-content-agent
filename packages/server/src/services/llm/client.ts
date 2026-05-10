/**
 * LLM Client — wraps OpenAI-compatible API
 * When no API key is configured, returns realistic mock content
 */
import { config } from '../../config'
import { logger } from '../logger'

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export class LLMClient {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor() {
    this.apiKey = config.openaiApiKey || config.anthropicApiKey || ''
    this.baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
    this.model = process.env.LLM_MODEL || 'gpt-4o-mini'
  }

  async chat(messages: ChatMessage[], temperature = 0.7, maxTokens = 2000): Promise<string> {
    if (!this.apiKey) {
      logger.warn('No LLM API key configured, using mock responses')
      return this.mockResponse(messages)
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ model: this.model, messages, temperature, max_tokens: maxTokens }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`LLM API error ${res.status}: ${err}`)
      }

      const data = await res.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (err: any) {
      logger.error({ err }, 'LLM call failed, falling back to mock')
      return this.mockResponse(messages)
    }
  }

  private mockResponse(messages: ChatMessage[]): string {
    const lastMsg = messages[messages.length - 1]?.content || ''
    const topicMatch = lastMsg.match(/标题[：:]\s*(.+?)[\n\r]/)
    const topic = topicMatch ? topicMatch[1].trim() : '新加坡留学'
    const catMatch = lastMsg.match(/分类[：:]\s*(.+?)[\n\r]/)
    const category = catMatch ? catMatch[1].trim() : '综合'

    // Content generation — specific markers that appear in generation prompts
    if (lastMsg.includes('生成一篇小红书') || lastMsg.includes('小红书图文内容') || lastMsg.includes('输出JSON格式')) {
      const bodyTemplates: Record<string, string> = {
        '院校相关': `姐妹们！今天来聊聊${topic} 👇\n\n作为一个过来人，我把所有想知道的都整理好了！\n\n📍 基本情况\n${topic}是很多同学关注的方向。根据最新数据，这个方向在新加坡的申请热度持续走高。\n\n💰 费用明细\n▪️ 学费：约 30,000-38,000 新币/年（国际生）\n▪️ MOE 减免后：约 15,000-17,000 新币/年\n▪️ 生活费：每月约 1,500-2,000 新币\n▪️ 住宿：校内 500-800 新币/月，校外 800-1,500 新币/月\n\n📊 关键数据\n▪️ QS 世界排名：NUS 第8、NTU 第15\n▪️ 就业率：毕业后6个月约 90%+\n▪️ 平均起薪：4,000-5,500 新币/月\n▪️ 国际学生比例：约 30%\n\n✅ 核心优势\n1. 教育质量全球认可，回国认证无忧\n2. 英语环境但华人文化，适应成本低\n3. 安全宜居，全球治安最好的国家之一\n4. 毕业后有 EP 工作签证机会\n5. 距离中国近，航班 4-6 小时\n\n❌ 需要注意\n1. 生活成本确实不低，需要做好预算\n2. 天气全年炎热，没有四季\n3. 竞争压力大，课程强度高\n4. 部分专业华人比例高，英语环境打折扣\n\n💡 过来人建议\n提前半年准备语言成绩，PS 要写出你和项目的真实匹配度。推荐信找了解你的老师，不要找大牛但写不出东西的。\n\n⚠️ 重要提醒\n申请 MOE 学费减免需要签 3 年工作协议，一定要提前了解清楚！\n\n你们还想了解什么？评论区告诉我！💬\n\n#新加坡留学 #留学申请 #NUS #NTU #留学攻略`,
        '申请攻略': `姐妹们！${topic}来了！这份攻略我整理了整整两周 📋\n\n干货太多，先收藏再看！\n\n📅 时间规划\n▪️ 提前 12 个月：确定目标院校和专业\n▪️ 提前 10 个月：开始准备雅思/托福\n▪️ 提前 6 个月：准备 PS、CV、推荐信\n▪️ 提前 3 个月：网申开放，提交申请\n▪️ 提前 1 个月：准备面试\n\n📝 核心材料清单\n1. 成绩单（中英文公证版）\n2. 毕业证/学位证或在读证明\n3. 语言成绩（雅思 6.5+ / 托福 92+）\n4. 个人陈述 PS（800-1000 字）\n5. 推荐信 ×2\n6. 简历 CV\n7. 护照复印件\n8. 财务证明\n\n💡 PS 写作技巧\n开头：用一个小故事引入，不要泛泛而谈\n中间：具体经历 + 学到的 + 为什么选这个项目\n结尾：职业规划 + 这个项目怎么帮你实现\n\n⚠️ 常见误区\n❌ PS 写成简历扩写版\n❌ 推荐信自己写找老师签字（一眼就能看出来）\n❌ 截止日期前一天才提交（系统可能崩溃）\n❌ 只申一所学校（一定要有保底）\n\n💰 费用预算\n申请费：每所 50-100 新币\n公证费：约 500 人民币/份\n语言考试：雅思 2170 / 托福 2100 人民币\n\n记得收藏这份清单，不要遗漏任何材料！📌\n\n有问题的评论区问～ 💬\n\n#新加坡留学 #留学申请 #申请攻略 #留学准备`,
        default: `姐妹们！今天来聊聊${topic} 👇\n\n很多同学都在问这个话题，作为一个过来人，我把所有要点都整理好了！\n\n📍 核心要点\n1. 新加坡的教育质量全球认可，QS排名亚洲第一\n2. 费用虽然不低，但 MOE 减免可以省一半学费\n3. 毕业后有机会拿 EP 工作签证\n4. 安全程度全球顶尖，家长放心\n\n💰 费用参考\n▪️ 学费：15,000-38,000 新币/年（减免后）\n▪️ 生活费：每月 1,500-2,500 新币\n▪️ 一年总费用：约 25-40 万人民币\n\n✅ 建议\n- 提前半年开始准备申请材料\n- 语言成绩尽早考出来\n- PS 一定要写具体，不要泛泛而谈\n- 多关注学校官网的最新信息\n\n你们还想了解什么？评论区见！💬\n\n#新加坡留学 #留学攻略`,
      }
      const template = bodyTemplates[category] || bodyTemplates.default
      return JSON.stringify({
        titles: [
          `🔥 ${topic}｜过来人给你讲透！`,
          `💻 ${topic}全攻略｜真实体验分享`,
          `🎓 ${topic}是什么体验？看这篇就够了`,
        ],
        body: template,
        tags: ['新加坡留学', '留学申请', 'NUS', 'NTU', '留学攻略'],
      })
    }

    // Topic recommendation — check AFTER generation to avoid false match on "## 选题" section header
    if (lastMsg.includes('推荐') && (lastMsg.includes('爆款选题') || lastMsg.includes('内容策划'))) {
      return JSON.stringify([
        { title: `${topic}到底值不值得？5个维度全解析`, category: '院校相关', score: 92, reason: '持续热门话题，搜索量月增15%' },
        { title: '2026新加坡留学申请完整时间线（附清单）', category: '申请攻略', score: 88, reason: '申请季即将开始，时效性强' },
        { title: '新加坡租房终极避坑指南｜区域价格全对比', category: '生活指南', score: 85, reason: '租房是刚需话题，互动率长期稳定' },
        { title: 'EP签证2026新政全解读：留学生必看', category: '政策解读', score: 83, reason: '政策变化是高关注度话题' },
        { title: 'NTU vs NUS 商科选校指南（在读生视角）', category: '院校相关', score: 81, reason: '对比类内容有天然传播力' },
      ])
    }

    // Quality scoring — check BEFORE style analysis since scoring prompt contains "博主风格"
    if (lastMsg.includes('质量评分') || lastMsg.includes('维度评分') || lastMsg.includes('style') && lastMsg.includes('accuracy') && lastMsg.includes('readability')) {
      return JSON.stringify({
        total: 82,
        detail: { style: 85, accuracy: 80, readability: 82 },
        feedback: '风格匹配度良好。建议：1) 增加更多具体数据支撑 2) 结尾 CTA 更明确 3) 可加入更多个人经历',
      })
    }

    // Style analysis
    if (lastMsg.includes('风格分析') || lastMsg.includes('内容风格') || (lastMsg.includes('风格') && lastMsg.includes('维度'))) {
      return JSON.stringify({
        title_patterns: { 'emoji开头': '60%', '数字开头': '25%', '疑问句': '15%' },
        opening_patterns: ['姐妹们！', '作为一个过来人', '今天来聊聊'],
        avg_paragraph_length: '2-3句',
        high_freq_words: ['姐妹们', '过来人', '整理好', '避坑', '必看', '收藏'],
        emoji_frequency: 'high',
        cta_patterns: ['评论区告诉我', '还想了解什么', '记得收藏'],
        tone: '亲切鼓励型，善用第二人称，有权威感但不居高临下',
        summary: '该博主风格亲切自然，大量使用"姐妹们"作为开头，段落短小精悍（2-3句），善用emoji增加可读性。内容实用导向，喜欢用清单体和对比格式。结尾常有互动引导，鼓励评论区留言。整体语气像朋友间的分享，有权威感但不居高临下。',
      })
    }

    return '[]'
  }
}

export const llmClient = new LLMClient()
