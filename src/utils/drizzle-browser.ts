// 浏览器环境的数据库配置
// 注意：在浏览器中我们使用 Supabase 客户端而不是直接的 Drizzle 连接

import * as schema from '../schema/index'

// 在浏览器环境中不使用 Drizzle ORM，而是通过 Supabase 客户端操作
export const db = null

// 导出 schema
export { schema }
export * from 'drizzle-orm/pg-core'

// 辅助函数：检查 Drizzle 是否可用
export function isDrizzleAvailable(): boolean {
  return false
}

// 辅助函数：获取数据库连接状态
export function getDbConnectionStatus(): {
  available: boolean
  message: string
  recommendation: string
} {
  return {
    available: false,
    message: '浏览器环境不支持直接数据库连接',
    recommendation: '请使用 Supabase 客户端 (supabase-database.ts) 进行数据库操作'
  }
}

// 辅助函数：检查是否在浏览器环境
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}