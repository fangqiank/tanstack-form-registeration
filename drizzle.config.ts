import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.VITE_DATABASE_URL ||
         process.env.VITE_SUPABASE_DATABASE_URL ||
         process.env.DATABASE_URL ||
         process.env.SUPABASE_DB_URL ||
         // 如果没有直接的数据库URL，从Supabase项目URL构建
         (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) ?
           `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || '[YOUR-PASSWORD]'}@db.${(process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').split('//')[1].split('.')[0]}.supabase.co:5432/postgres` :
           ''
  },
  verbose: true,
  strict: true,
  // 为 Supabase 添加额外配置
  ...(process.env.VITE_SUPABASE_URL && {
    // 如果检测到 Supabase URL，添加 Supabase 特定配置
    extensions: ['uuid-ossp', 'pgcrypto'],
    schemaFilter: ['public']
  })
})