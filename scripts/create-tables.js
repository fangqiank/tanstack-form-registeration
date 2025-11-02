#!/usr/bin/env node

/**
 * 创建 Supabase 表结构的简化脚本
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 加载环境变量
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 需要设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🚀 开始创建 Supabase 表结构...')

// SQL 语句来创建表
const createTablesSQL = `
-- 创建性别枚举
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

-- 创建用户表
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone VARCHAR,
    birth_date VARCHAR,
    gender gender,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建用户偏好设置表
CREATE TABLE IF NOT EXISTS test_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
    newsletter BOOLEAN DEFAULT FALSE NOT NULL,
    notifications BOOLEAN DEFAULT FALSE NOT NULL,
    privacy_public BOOLEAN DEFAULT FALSE NOT NULL,
    marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);
CREATE INDEX IF NOT EXISTS idx_test_users_created_at ON test_users(created_at);
CREATE INDEX IF NOT EXISTS idx_test_user_preferences_user_id ON test_user_preferences(user_id);

-- 启用行级安全
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON test_users FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON test_users FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON test_users FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Users can view all preferences" ON test_user_preferences FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can insert their own preferences" ON test_user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users can update their own preferences" ON test_user_preferences FOR UPDATE USING (true);
`

console.log('📝 请在 Supabase SQL Editor 中执行以下 SQL:')
console.log('=' * 60)
console.log(createTablesSQL)
console.log('=' * 60)

console.log('')
console.log('🔗 操作步骤:')
console.log('1. 打开 https://app.supabase.com')
console.log('2. 进入你的项目: fhwphuseygbeucyoxhof')
console.log('3. 点击 "SQL Editor"')
console.log('4. 复制上面的 SQL 代码并执行')
console.log('')

// 测试连接并检查是否已有表
async function checkTables() {
  try {
    const { data, error } = await supabase
      .from('test_users')
      .select('count')
      .limit(1)

    if (error && error.code === 'PGRST116') {
      console.log('✅ 连接成功，但表不存在（这是正常的）')
      console.log('👆 请按照上面的步骤创建表')
    } else if (error) {
      console.log('⚠️ 连接问题:', error.message)
    } else {
      console.log('✅ 表已存在！可以继续使用')
    }
  } catch (err) {
    console.log('❌ 连接失败:', err.message)
  }
}

checkTables()

console.log('')
console.log('🎯 执行完 SQL 后，运行 node scripts/test-config.js 验证配置')