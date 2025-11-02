// Supabase 数据库配置 - Serverless 架构优化
// 支持多种部署模式：直接连接、Edge Functions、Vercel 等
import { createClient } from '@supabase/supabase-js'

const SUPABASE_CONFIG = {
  // Supabase 项目配置
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

  // 如果没有配置，提供示例配置
  fallbackConfig: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
  },

  // Serverless 架构配置
  serverless: {
    // 连接模式：'direct' | 'edge' | 'functions'
    mode: (import.meta.env.VITE_SUPABASE_MODE as 'direct' | 'edge' | 'functions') || 'direct',

    // Edge Functions 配置
    edgeUrl: import.meta.env.VITE_SUPABASE_EDGE_URL || '/api/supabase',

    // 连接池配置（Serverless 环境建议使用较小值）
    maxConnections: Number(import.meta.env.VITE_SUPABASE_MAX_CONNECTIONS) || 1,

    // 超时配置（毫秒）
    connectionTimeout: Number(import.meta.env.VITE_SUPABASE_TIMEOUT) || 10000,

    // 重试配置
    maxRetries: Number(import.meta.env.VITE_SUPABASE_MAX_RETRIES) || 3,

    // 缓存配置
    enableCache: import.meta.env.VITE_SUPABASE_ENABLE_CACHE !== 'false',
    cacheTTL: Number(import.meta.env.VITE_SUPABASE_CACHE_TTL) || 300000, // 5分钟
  }
}

// 获取 Supabase URL
function getSupabaseUrl(): string {
  return SUPABASE_CONFIG.supabaseUrl || SUPABASE_CONFIG.fallbackConfig.url
}

// 获取 Supabase Anon Key
function getSupabaseAnonKey(): string {
  return SUPABASE_CONFIG.supabaseAnonKey || SUPABASE_CONFIG.fallbackConfig.anonKey
}

// 创建数据库连接字符串（用于 Drizzle）
function getDatabaseUrl(): string {
  // 从环境变量获取完整的数据库连接字符串
  const directUrl = import.meta.env.VITE_DATABASE_URL || import.meta.env.DATABASE_URL
  if (directUrl) {
    return directUrl
  }

  // 如果没有直接连接字符串，构建一个用于 Supabase 的连接字符串
  // 注意：实际使用时需要从 Supabase 项目设置中获取完整的连接字符串
  const supabaseUrl = getSupabaseUrl()
  const projectId = supabaseUrl.split('//')[1].split('.')[0]
  return `postgresql://postgres:[YOUR-PASSWORD]@db.${projectId}.supabase.co:5432/postgres`
}

// 创建 Supabase 客户端
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    persistSession: false, // 对于匿名操作，不需要持久化会话
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'tanstack-form-supabase-demo/1.0.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  }
})

export {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getDatabaseUrl,
  SUPABASE_CONFIG
}

// 注意：类型定义已移至 src/types/database.ts