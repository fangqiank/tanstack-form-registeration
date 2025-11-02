/**
 * Jotai 用户管理 Atoms
 *
 * 使用 Jotai 进行用户状态管理，展示原子化状态管理的特点
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { atomWithQuery } from 'jotai-tanstack-query'
import { ApiService } from '../utils/api'
import type {
  User,
  NewUser,
  UserUpdate,
  UserPreferences,
  PaginationState,
  UserStatsState
} from '../stores/types'

// ====== 基础原子状态 ======

// 当前用户状态（持久化）
export const currentUserAtom = atomWithStorage<User | null>('jotai-current-user', null)

// 用户认证状态
export const isAuthenticatedAtom = atom<boolean>(false)

// 用户列表状态
export const usersAtom = atom<User[]>([])

// 分页状态
export const paginationAtom = atom<PaginationState>({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// 过滤器状态
export const userFiltersAtom = atom<{
  gender?: 'male' | 'female' | 'other'
  newsletter?: boolean
  privacyPublic?: boolean
  search?: string
}>({})

// 用户统计状态
export const userStatsAtom = atom<UserStatsState | null>(null)

// ====== 查询原子 (使用 jotai-tanstack-query) ======

// 获取用户列表
export const usersQueryAtom = atomWithQuery(() => ({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await ApiService.users.getAll()
    return response.data || []
  },
  staleTime: 5 * 60 * 1000, // 5分钟
}))

// 获取用户统计
export const userStatsQueryAtom = atomWithQuery(() => ({
  queryKey: ['user-stats'],
  queryFn: async () => {
    const response = await ApiService.users.getStats()
    return response.data
  },
  staleTime: 10 * 60 * 1000, // 10分钟
}))

// 获取单个用户（动态参数）
export const userQueryAtom = (userId: string) => atomWithQuery(() => ({
  queryKey: ['user', userId],
  queryFn: async () => {
    const response = await ApiService.users.getById(userId)
    return response.data
  },
  enabled: !!userId,
  staleTime: 2 * 60 * 1000 // 2分钟
}))

// ====== 派生原子 ======

// 用户总数
export const totalUsersAtom = atom(
  (get) => get(userStatsQueryAtom)?.data?.total_users || 0
)

// 性别分布
export const genderDistributionAtom = atom(
  (get) => {
    const stats = get(userStatsQueryAtom)?.data
    if (!stats) return null
    return {
      male: stats.male_users,
      female: stats.female_users,
      other: stats.other_users
    }
  }
)

// 活跃用户数
export const activeUsersAtom = atom(
  (get) => {
    const stats = get(userStatsQueryAtom)?.data
    if (!stats) return 0
    return stats.public_profiles + stats.newsletter_subscribers
  }
)

// 当前用户的偏好设置
export const currentUserPreferencesAtom = atom(
  (get) => {
    const user = get(currentUserAtom)
    if (!user) return null
    return {
      newsletter: user.newsletter || false,
      notifications: user.notifications || false,
      privacyPublic: user.privacy_public || false,
      marketingEmails: user.marketing_emails || false
    }
  }
)

// 过滤后的用户列表
export const filteredUsersAtom = atom(
  (get) => {
    const users = get(usersAtom)
    const filters = get(userFiltersAtom)

    if (!filters.search && !filters.gender && filters.newsletter === undefined && filters.privacyPublic === undefined) {
      return users
    }

    return users.filter((user) => {
      // 搜索过滤
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch =
          user.email.toLowerCase().includes(searchTerm) ||
          user.first_name.toLowerCase().includes(searchTerm) ||
          user.last_name.toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // 性别过滤
      if (filters.gender && user.gender !== filters.gender) return false

      // 新闻订阅过滤
      if (filters.newsletter !== undefined && user.newsletter !== filters.newsletter) return false

      // 隐私设置过滤
      if (filters.privacyPublic !== undefined && user.privacy_public !== filters.privacyPublic) return false

      return true
    })
  }
)

// 分页用户列表
export const paginatedUsersAtom = atom(
  (get) => {
    const users = get(filteredUsersAtom)
    const pagination = get(paginationAtom)
    const startIndex = (pagination.page - 1) * pagination.limit
    const endIndex = startIndex + pagination.limit

    return users.slice(startIndex, endIndex)
  }
)

// ====== 动作原子 ======

// 创建用户的操作原子
export const createUserAtom = atom(
  null,
  async (get, set, userData: NewUser) => {
    try {
      set(null) // 重置错误状态
      const response = await ApiService.users.create(userData)

      if (response.success && response.data) {
        // 更新用户列表
        set(usersAtom, (prev) => [response.data!, ...prev])
        // 设置当前用户
        set(currentUserAtom, response.data!)
        // 显示成功通知
        set(successMessageAtom, 'User created successfully')
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create user')
      }
    } catch (error) {
      set(errorAtom, error instanceof Error ? error.message : 'Failed to create user')
      throw error
    }
  }
)

// 更新用户的操作原子
export const updateUserAtom = atom(
  null,
  async (get, set, { id, userData }: { id: string; userData: UserUpdate }) => {
    try {
      set(null) // 重置错误状态
      const response = await ApiService.users.update(id, userData)

      if (response.success && response.data) {
        // 更新用户列表
        set(usersAtom, (prev) =>
          prev.map((user) => (user.id === id ? response.data! : user))
        )
        // 更新当前用户
        set(currentUserAtom, (prev) =>
          prev?.id === id ? response.data! : prev
        )
        // 显示成功通知
        set(successMessageAtom, 'User updated successfully')
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update user')
      }
    } catch (error) {
      set(errorAtom, error instanceof Error ? error.message : 'Failed to update user')
      throw error
    }
  }
)

// 删除用户的操作原子
export const deleteUserAtom = atom(
  null,
  async (get, set, { id, softDelete = true }: { id: string; softDelete?: boolean }) => {
    try {
      set(null) // 重置错误状态
      await ApiService.users.delete(id, softDelete)

      // 从用户列表中移除
      set(usersAtom, (prev) => prev.filter((user) => user.id !== id))
      // 清除当前用户（如果是当前用户）
      set(currentUserAtom, (prev) => prev?.id === id ? null : prev)
      // 显示成功通知
      set(successMessageAtom, `User ${softDelete ? 'soft deleted' : 'deleted'} successfully`)
    } catch (error) {
      set(errorAtom, error instanceof Error ? error.message : 'Failed to delete user')
      throw error
    }
  }
)

// 检查邮箱是否存在的操作原子
export const checkEmailExistsAtom = atom(
  null,
  async (get, set, email: string) => {
    try {
      const exists = await ApiService.users.checkEmailExists(email)
      set(emailExistsAtom, exists)
      return exists
    } catch (error) {
      set(errorAtom, error instanceof Error ? error.message : 'Failed to check email')
      return false
    }
  }
)

// ====== 辅助原子 ======

// 邮箱存在检查结果
export const emailExistsAtom = atom<boolean>(false)

// 错误状态
export const errorAtom = atom<string | null>(null)

// 成功消息
export const successMessageAtom = atom<string | null>(null)

// 加载状态
export const loadingAtom = atom<boolean>(false)

// 重置消息的原子
export const resetMessagesAtom = atom(
  null,
  (get, set) => {
    set(errorAtom, null)
    set(successMessageAtom, null)
  }
)

// 清除错误
export const clearErrorAtom = atom(
  null,
  (get, set) => set(errorAtom, null)
)

// 清除成功消息
export const clearSuccessAtom = atom(
  null,
  (get, set) => set(successMessageAtom, null)
)

// 导出用户 atoms 组
export const userAtoms = {
  // 状态原子
  currentUserAtom,
  isAuthenticatedAtom,
  usersAtom,
  paginationAtom,
  userFiltersAtom,
  userStatsAtom,

  // 查询原子
  usersQueryAtom,
  userStatsQueryAtom,
  userQueryAtom,

  // 派生原子
  totalUsersAtom,
  genderDistributionAtom,
  activeUsersAtom,
  currentUserPreferencesAtom,
  filteredUsersAtom,
  paginatedUsersAtom,

  // 操作原子
  createUserAtom,
  updateUserAtom,
  deleteUserAtom,
  checkEmailExistsAtom,

  // 辅助原子
  emailExistsAtom,
  errorAtom,
  successMessageAtom,
  loadingAtom,
  resetMessagesAtom,
  clearErrorAtom,
  clearSuccessAtom
}