// 直接数据库操作工具
// 使用 Supabase PostgreSQL 替代 Neon

import { userDatabase } from './supabase-database'
import { getDatabaseUrl } from './supabase'

// 为了向后兼容，保留原有的 queryDatabase 函数
// 但现在它将使用 Supabase 原生操作
async function queryDatabase(sql: string, params: any[] = []): Promise<any[]> {
  console.warn('注意: queryDatabase 函数已弃用，请使用 supabaseDatabase 或 userDatabase 中的具体方法')

  // 这里可以根据 SQL 类型调用相应的 Supabase 方法
  // 但为了更好的性能和类型安全，建议直接使用 supabaseDatabase 的方法
  try {
    // 这是一个简化的回退实现
    if (sql.includes('SELECT COUNT(*)') && sql.includes('FROM public.test_users') && sql.includes('WHERE email')) {
      const email = params[0]
      const exists = await userDatabase.checkEmailExists(email)
      return [{ count: exists ? 1 : 0 }]
    }

    // 其他操作...
    return []
  } catch (error) {
    console.error('回退查询失败:', error)
    return await simulateDatabaseQuery(sql, params)
  }
}

// 模拟数据库查询作为回退方案
async function simulateDatabaseQuery(sql: string, params: any[] = []): Promise<any[]> {
  console.log('模拟数据库查询:', { sql, params })

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 模拟基本的数据操作
  if (sql.includes('SELECT COUNT(*)') && sql.includes('FROM public.test_users') && sql.includes('WHERE email')) {
    return [{ count: 0 }] // 假设邮箱不存在
  }

  if (sql.includes('INSERT INTO public.test_users')) {
    // 模拟返回创建的用户数据
    return [{
      id: 'mock-user-' + Date.now(),
      email: params[0],
      first_name: params[1],
      last_name: params[2],
      phone: params[3],
      birth_date: params[4],
      gender: params[5],
      bio: params[6],
      avatar_url: params[7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]
  }

  if (sql.includes('INSERT INTO public.test_user_preferences')) {
    // 模拟返回创建的偏好设置
    return [{
      id: 'mock-pref-' + Date.now(),
      user_id: params[0],
      newsletter: params[1],
      notifications: params[2],
      privacy_public: params[3],
      marketing_emails: params[4]
    }]
  }

  return []
}

// 重新导出 Supabase 数据库操作，保持向后兼容
export { userDatabase } from './supabase-database'

// 同时导出别名以保持一致性
export { userDatabase as supabaseDatabase } from './supabase-database'

// 导出头像更新函数
export { updateUserAvatar } from './supabase-database'

export { queryDatabase }