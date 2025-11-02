import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../schema/index'

// 创建 Supabase PostgreSQL 连接
const connectionString =
  import.meta.env.VITE_DATABASE_URL ||
  import.meta.env.VITE_SUPABASE_DATABASE_URL ||
  import.meta.env.DATABASE_URL ||
  // 从 Supabase URL 构建连接字符串
  (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) ?
    `postgresql://postgres:${import.meta.env.VITE_SUPABASE_DB_PASSWORD || import.meta.env.SUPABASE_DB_PASSWORD || '[YOUR-PASSWORD]'}@db.${(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '').split('//')[1].split('.')[0]}.supabase.co:5432/postgres` :
    ''

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
  console.warn('Supabase 数据库连接字符串未正确配置，Drizzle ORM 将使用模拟模式')
}

// 创建 postgres 客户端（为 Supabase 优化配置）
const client = connectionString && !connectionString.includes('[YOUR-PASSWORD]') ? postgres(connectionString, {
  ssl: 'require',
  max: 1, // Serverless 环境建议使用较小连接池
  idle_timeout: 20,
  connect_timeout: 10
}) : null

// 创建 Drizzle ORM 实例
export const db = client ? drizzle(client, { schema }) : null

// 导出 schema
export { schema }
export * from 'drizzle-orm/pg-core'

// 辅助函数：检查 Drizzle 是否可用
export function isDrizzleAvailable(): boolean {
  return db !== null
}

// 辅助函数：获取数据库连接状态
export function getDbConnectionStatus(): {
  available: boolean
  message: string
} {
  if (!connectionString) {
    return {
      available: false,
      message: '未配置数据库连接字符串'
    }
  }

  if (connectionString.includes('[YOUR-PASSWORD]')) {
    return {
      available: false,
      message: '请在环境变量中配置 SUPABASE_DB_PASSWORD'
    }
  }

  if (!db) {
    return {
      available: false,
      message: 'Drizzle ORM 客户端初始化失败'
    }
  }

  return {
    available: true,
    message: 'Supabase 连接已就绪'
  }
}