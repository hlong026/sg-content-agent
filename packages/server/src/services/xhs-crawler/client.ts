/**
 * Spider_XHS API 客户端
 * 通过 HTTP 调用 Spider_XHS FastAPI 服务，获取小红书数据
 */
import { config } from '../../config'
import { logger } from '../logger'

const XHS_API_BASE = process.env.XHS_API_URL || 'http://localhost:5557'

interface XhsResponse<T = any> {
  success: boolean
  data?: T
  count?: number
  detail?: string
}

async function xhsRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${XHS_API_BASE}${path}`
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.detail || `Spider_XHS API error ${res.status}`)
    }
    return json as T
  } catch (err: any) {
    if (err.cause?.code === 'ECONNREFUSED') {
      throw new Error('Spider_XHS 服务未启动，请先运行: cd Spider_XHS && python server/api_server.py')
    }
    throw err
  }
}

// ─── 类型定义 ────────────────────────────────────────────

export interface XhsSearchNote {
  note_id: string
  title: string
  type: string
  cover_url: string
  user_name: string
  user_id: string
  likes: string
  collects: string
  comments: string
  share_count: string
  xsec_token: string
  note_url: string
  tag_list: { name: string; id: string }[]
}

export interface XhsNoteDetail {
  note_id: string
  title: string
  desc: string
  type: string
  user_name: string
  user_id: string
  likes: string
  collects: string
  comments_count: string
  share_count: string
  images: string[]
  tags: string[]
  time: string
  last_update_time: string
}

export interface XhsUserNote {
  note_id: string
  title: string
  type: string
  cover_url: string
  likes: string
  collects: string
  comments: string
  xsec_token: string
  note_url: string
}

// ─── API 调用 ────────────────────────────────────────────

export async function checkXhsHealth(): Promise<{ ok: boolean; cookieConfigured: boolean }> {
  try {
    const health = await xhsRequest<any>('/health')
    const cookie = await xhsRequest<any>('/api/cookie/status')
    return { ok: health.status === 'ok', cookieConfigured: cookie.configured }
  } catch {
    return { ok: false, cookieConfigured: false }
  }
}

export async function updateXhsCookie(cookies: string): Promise<void> {
  await xhsRequest('/api/cookie/update', {
    method: 'POST',
    body: JSON.stringify({ cookies }),
  })
}

/**
 * 搜索小红书笔记
 * @param query 搜索关键词
 * @param num 获取数量
 * @param sort 排序方式: 0综合 1最新 2最多点赞 3最多评论 4最多收藏
 */
export async function searchNotes(
  query: string,
  num = 20,
  sort: 0 | 1 | 2 | 3 | 4 = 2, // 默认按最多点赞
): Promise<XhsSearchNote[]> {
  const res = await xhsRequest<XhsResponse<XhsSearchNote[]>>('/api/search/notes', {
    method: 'POST',
    body: JSON.stringify({ query, num, sort }),
  })
  return res.data || []
}

/**
 * 获取笔记详情
 */
export async function getNoteDetail(url: string): Promise<XhsNoteDetail> {
  const res = await xhsRequest<XhsResponse<XhsNoteDetail>>('/api/note/detail', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
  return res.data!
}

/**
 * 获取用户所有笔记
 */
export async function getUserNotes(userUrl: string): Promise<XhsUserNote[]> {
  const res = await xhsRequest<XhsResponse<XhsUserNote[]>>('/api/user/notes', {
    method: 'POST',
    body: JSON.stringify({ user_url: userUrl }),
  })
  return res.data || []
}

/**
 * 获取搜索关键词推荐
 */
export async function getSearchKeywords(word: string): Promise<string[]> {
  const res = await xhsRequest<XhsResponse<string[]>>(`/api/search/keywords?word=${encodeURIComponent(word)}`)
  return res.data || []
}

/**
 * 发布笔记到小红书
 */
export async function publishNote(params: {
  title: string
  desc: string
  images?: string[]
  topics?: string[]
}): Promise<any> {
  const res = await xhsRequest<XhsResponse>('/api/publish/note', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return res.data
}
