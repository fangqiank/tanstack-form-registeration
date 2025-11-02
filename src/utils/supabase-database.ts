// Supabase 数据库操作工具
// 使用 Supabase 原生客户端进行数据库操作

import { supabase } from './supabase'
import { createPasswordHash, verifyPassword } from './password'

// 数据库类型定义 - 直接定义避免导入问题
export interface User {
  id: string
  email: string
  password?: string // 注意：密码通常不会返回给客户端
  first_name: string
  last_name: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
}

export interface UserPreference {
  id: string
  user_id: string
  newsletter: boolean
  notifications: boolean
  privacy_public: boolean
  marketing_emails: boolean
  created_at: string
}

// Supabase 数据库操作
export const supabaseDatabase = {
  // 创建新用户
  async createUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    birthDate?: string
    gender?: string
    bio?: string
  }): Promise<User> {
    try {
      console.log('Supabase 创建用户开始:', userData.email)

      // 加密密码
      const hashedPassword = await createPasswordHash(userData.password)
      console.log('密码加密完成')

      const { data, error } = await supabase
        .from('test_users')
        .insert([
          {
            email: userData.email,
            password: hashedPassword,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone || null,
            birth_date: userData.birthDate || null,
            gender: userData.gender || null,
            bio: userData.bio || null,
            avatar_url: null, // 暂时设为null
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Supabase 创建用户错误:', error)
        throw error
      }

      console.log('Supabase 用户创建成功:', data)
      return data
    } catch (error) {
      console.error('创建用户失败:', error)
      throw error
    }
  },

  // 根据邮箱查找用户
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log('查找用户:', email)

      const { data, error } = await supabase
        .from('test_users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('查询用户错误:', error)
        return null
      }

      console.log('用户查询成功:', data)
      return data
    } catch (error) {
      console.error('查询用户异常:', error)
      return null
    }
  },

  // 验证用户登录
  async verifyUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email)
      if (!user) {
        return null
      }

      if (user.password && await verifyPassword(password, user.password)) {
        console.log('用户验证成功')
        return user
      }

      return null
    } catch (error) {
      console.error('验证用户失败:', error)
      return null
    }
  },

  // 创建用户偏好设置
  async createUserPreferences(preferences: {
    userId: string
    newsletter: boolean
    notifications: boolean
    privacyPublic: boolean
    marketingEmails: boolean
  }): Promise<UserPreference> {
    try {
      console.log('创建用户偏好设置:', preferences.userId)

      const { data, error } = await supabase
        .from('test_user_preferences')
        .insert([
          {
            user_id: preferences.userId,
            newsletter: preferences.newsletter,
            notifications: preferences.notifications,
            privacy_public: preferences.privacyPublic,
            marketing_emails: preferences.marketingEmails,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('创建用户偏好设置错误:', error)
        throw error
      }

      console.log('用户偏好设置创建成功:', data)
      return data
    } catch (error) {
      console.error('创建用户偏好设置异常:', error)
      throw error
    }
  },

  // 检查邮箱是否已存在
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // 直接使用fetch API避免406错误
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL or API Key not configured')
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/test_users?select=id&email=eq.${encodeURIComponent(email)}&limit=1`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'  // 明确指定Accept为application/json
          }
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('检查邮箱API错误:', response.status, response.statusText, errorText)
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('邮箱检查结果:', data)
      return Array.isArray(data) && data.length > 0
    } catch (error) {
      console.error('检查邮箱存在性失败:', error)
      // 如果是网络错误或其他问题，返回false（允许继续注册）
      return false
    }
  },

  // 获取用户统计信息
  async getUserStats(userId: string): Promise<{
    totalUsers: number
    preferencesCount: number
  }> {
    try {
      console.log('获取用户统计:', userId)

      // 获取总用户数
      const { count: totalUsers } = await supabase
        .from('test_users')
        .select('*', { count: 'exact', head: true })

      // 获取用户偏好设置数量
      const { count: preferencesCount } = await supabase
        .from('test_user_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      const stats = {
        totalUsers: totalUsers || 0,
        preferencesCount: preferencesCount || 0
      }

      console.log('Supabase 用户统计:', stats)
      return stats
    } catch (error) {
      console.error('获取用户统计失败:', error)
      throw error
    }
  },

  // 更新用户头像
  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('test_users')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('更新头像URL失败:', error)
        throw error
      }

      console.log('头像URL更新成功')
    } catch (error) {
      console.error('更新头像URL异常:', error)
      throw error
    }
  }
}

// 为了向后兼容，导出与 userDatabase 相同的接口
export const userDatabase = supabaseDatabase

// 更新用户头像的独立函数
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('test_users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('更新头像URL失败:', error)
      throw error
    }

    console.log('头像URL更新成功')
  } catch (error) {
    console.error('更新头像URL异常:', error)
    throw error
  }
}