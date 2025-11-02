/**
 * 状态管理类型定义
 *
 * 定义 Zustand 和 Jotai 共享的类型接口
 */

// 用户类型
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  newsletter?: boolean
  notifications?: boolean
  privacy_public?: boolean
  marketing_emails?: boolean
}

// 新用户注册数据
export interface NewUser {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other' | ''
  bio?: string
  newsletter?: boolean
  notifications?: boolean
  privacyPublic?: boolean
  marketingEmails?: boolean
  terms: boolean
  avatar?: File | null
}

// 用户更新数据
export interface UserUpdate {
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other' | ''
  bio?: string
  avatarUrl?: string
}

// 用户偏好设置
export interface UserPreferences {
  newsletter?: boolean
  notifications?: boolean
  privacyPublic?: boolean
  marketingEmails?: boolean
}

// API 状态
export interface ApiState {
  loading: boolean
  error: string | null
  success: string | null
}

// 分页状态
export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 用户列表状态
export interface UserListState {
  users: User[]
  pagination: PaginationState
  filters: {
    gender?: 'male' | 'female' | 'other'
    newsletter?: boolean
    privacyPublic?: boolean
  }
}

// 用户统计状态
export interface UserStatsState {
  total_users: number
  male_users: number
  female_users: number
  other_users: number
  public_profiles: number
  newsletter_subscribers: number
  marketing_subscribers: number
}

// UI 状态
export interface UIState {
  sidebarOpen: boolean
  darkMode: boolean
  currentPage: string
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    timestamp: number
    autoClose?: boolean
  }>
}

// 表单状态
export interface FormState {
  isDirty: boolean
  isValid: boolean
  isSubmitting: boolean
  canSubmit: boolean
  touchedFields: Set<string>
  errors: Record<string, string[]>
}

// 应用全局���态
export interface AppState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
}

// 错误类型
export interface AppError {
  message: string
  code?: string
  status?: number
  details?: any
}