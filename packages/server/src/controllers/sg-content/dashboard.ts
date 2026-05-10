import type { Context } from 'koa'
import * as svc from '../../services/sg-content/dashboard'

export async function stats(ctx: Context) {
  ctx.body = { data: svc.getDashboardStats() }
}

export async function recentContents(ctx: Context) {
  ctx.body = { data: svc.getRecentContents() }
}

export async function pendingReview(ctx: Context) {
  ctx.body = { data: svc.getPendingReview() }
}

export async function topTopics(ctx: Context) {
  ctx.body = { data: svc.getTopTopics() }
}

export async function todaySchedule(ctx: Context) {
  ctx.body = { data: svc.getTodaySchedule() }
}
