/**
 * API Service
 *
 * 前端与后端 API 通信的服务层
 */

// API 配置
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  apiPrefix: import.meta.env.VITE_API_PREFIX || '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  retries: Number(import.meta.env.VITE_API_RETRIES) || 3
}

// 通用 API 错误类
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 请求响应接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 用户接口
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
}

export interface UserUpdate {
  firstName?: string
  lastName?: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other' | ''
  bio?: string
}

export interface UserPreferences {
  newsletter?: boolean
  notifications?: boolean
  privacyPublic?: boolean
  marketingEmails?: boolean
}

// HTTP 客户端类
class HttpClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const controller = new AbortController()

    // 设置超时
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || 'Request failed',
          response.status,
          data.code,
          data.details
        )
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'TIMEOUT')
        }
        throw new ApiError(error.message, 500, 'NETWORK_ERROR')
      }

      throw new ApiError('Unknown error occurred', 500, 'UNKNOWN_ERROR')
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.request<T>(url.pathname + url.search)
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }
}

// 创建 HTTP 客户端实例
const httpClient = new HttpClient(`${API_CONFIG.baseURL}${API_CONFIG.apiPrefix}`)

// API 服务类
export class ApiService {
  // 用户相关 API
  static readonly users = {
    // 获取所有用户
    getAll: async (params?: {
      page?: number
      limit?: number
      gender?: 'male' | 'female' | 'other'
      newsletter?: boolean
      privacyPublic?: boolean
    }) => {
      return httpClient.get<User[]>('/users', params)
    },

    // 获取用户统计信息
    getStats: async () => {
      return httpClient.get<{
        total_users: number
        male_users: number
        female_users: number
        other_users: number
        public_profiles: number
        newsletter_subscribers: number
        marketing_subscribers: number
      }>('/users/stats')
    },

    // 根据 ID 获取用户
    getById: async (id: string) => {
      return httpClient.get<User>(`/users/${id}`)
    },

    // 根据邮箱获取用户
    getByEmail: async (email: string) => {
      return httpClient.get<User>(`/users/email/${encodeURIComponent(email)}`)
    },

    // 创建用户
    create: async (userData: NewUser) => {
      const { confirmPassword, terms, ...apiUserData } = userData
      return httpClient.post<User>('/users', {
        ...apiUserData,
        newsletter: apiUserData.newsletter || false,
        notifications: apiUserData.notifications || false,
        privacyPublic: apiUserData.privacyPublic || false,
        marketingEmails: apiUserData.marketingEmails || false,
      })
    },

    // 更新用户信息
    update: async (id: string, userData: UserUpdate) => {
      return httpClient.put<User>(`/users/${id}`, userData)
    },

    // 更新用户偏好设置
    updatePreferences: async (id: string, preferences: UserPreferences) => {
      return httpClient.put<User>(`/users/${id}/preferences`, preferences)
    },

    // 删除用户
    delete: async (id: string, softDelete = true) => {
      return httpClient.delete<User>(`/users/${id}?soft=${softDelete}`)
    },

    // 检查邮箱是否存在（使用专用 API）
    checkEmailExists: async (email: string): Promise<boolean> => {
      try {
        const response = await httpClient.post<{ exists: boolean; email: string }>('/users/check-email', { email })
        return response.data?.exists || false
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          // 验证错误，视为邮箱不存在
          return false
        }
        throw error
      }
    }
  }

  // 系统相关 API
  static readonly system = {
    // 健康检查
    healthCheck: async () => {
      const response = await fetch(`${API_CONFIG.baseURL}/health`)
      return response.json()
    }
  }
}

// 错误处理工具
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    // 开发环境显示详细错误
    if (import.meta.env.DEV) {
      console.error('API Error:', error)
    }

    // 根据错误类型返回用户友好的消息
    switch (error.status) {
      case 400:
        return '请求参数错误，请检查输入信息'
      case 401:
        return '未授权访问，请重新登录'
      case 403:
        return '没有权限执行此操作'
      case 404:
        return '请求的资源不存在'
      case 409:
        return '数据冲突，该邮箱已被注册'
      case 408:
        return '请求超时，请检查网络连接'
      case 429:
        return '请求过于频繁，请稍后再试'
      case 500:
        return '服务器内部错误，请稍后重试'
      case 503:
        return '服务暂时不可用，请稍后重试'
      default:
        return error.message || '操作失败，请稍后重试'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return '未知错误，请稍后重试'
}

// 请求重试工具
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = API_CONFIG.retries
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break
      }

      // 某些错误不需要重试
      if (error instanceof ApiError) {
        if ([400, 401, 403, 404, 409].includes(error.status)) {
          break
        }
      }

      // 指数退避重试
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// 导出默认实例
export default ApiService