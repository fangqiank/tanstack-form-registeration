/**
 * Zustand 用户管理 Store
 *
 * 使用 Zustand 进行用户状态管理，提供完整的 CRUD 操作
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ApiService } from '../utils/api'
import type {
  User,
  NewUser,
  UserUpdate,
  UserPreferences,
  UserListState,
  UserStatsState,
  ApiState,
  PaginationState
} from './types'

// 用户 Store 接口
interface UserStore extends UserListState {
  // 状态
  loading: boolean
  error: string | null
  success: string | null
  currentUser: User | null
  stats: UserStatsState | null

  // 用户列表操作
  fetchUsers: (page?: number, limit?: number, filters?: UserListState['filters']) => Promise<void>
  refreshUsers: () => Promise<void>
  clearUsers: () => void

  // 单个用户操作
  fetchUserById: (id: string) => Promise<User | null>
  fetchUserByEmail: (email: string) => Promise<User | null>
  createUser: (userData: NewUser) => Promise<User | null>
  updateUser: (id: string, userData: UserUpdate) => Promise<User | null>
  deleteUser: (id: string, softDelete?: boolean) => Promise<void>

  // 偏好设置操作
  updateUserPreferences: (id: string, preferences: UserPreferences) => Promise<void>

  // 邮箱检查
  checkEmailExists: (email: string) => Promise<boolean>

  // 统计数据
  fetchStats: () => Promise<void>

  // 状态管理
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccess: (message: string | null) => void
  clearMessages: () => void

  // 当前用户管理
  setCurrentUser: (user: User | null) => void
  clearCurrentUser: () => void

  // 分页和过滤
  setPagination: (pagination: Partial<PaginationState>) => void
  setFilters: (filters: Partial<UserListState['filters']>) => void
  clearFilters: () => void
}

// 创建 Zustand Store
export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        },
        filters: {},
        loading: false,
        error: null,
        success: null,
        currentUser: null,
        stats: null,

        // 用户列表操作
        fetchUsers: async (page = 1, limit = 10, filters = {}) => {
          set({ loading: true, error: null, success: null })

          try {
            const params = { page, limit, ...filters }
            const response = await ApiService.users.getAll(params)

            if (response.success && response.data && response.pagination) {
              set({
                users: response.data,
                pagination: response.pagination,
                loading: false,
                success: 'Users loaded successfully'
              })
            } else {
              throw new Error(response.error || 'Failed to fetch users')
            }
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch users',
              success: null
            })
          }
        },

        refreshUsers: async () => {
          const { pagination, filters } = get()
          await get().fetchUsers(pagination.page, pagination.limit, filters)
        },

        clearUsers: () => {
          set({
            users: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0
            },
            filters: {}
          })
        },

        // 单个用户操作
        fetchUserById: async (id: string) => {
          set({ loading: true, error: null })

          try {
            const response = await ApiService.users.getById(id)

            if (response.success && response.data) {
              set({
                currentUser: response.data,
                loading: false,
                success: 'User loaded successfully'
              })
              return response.data
            } else {
              throw new Error(response.error || 'User not found')
            }
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user',
              currentUser: null
            })
            return null
          }
        },

        fetchUserByEmail: async (email: string) => {
          set({ loading: true, error: null })

          try {
            const response = await ApiService.users.getByEmail(email)

            if (response.success && response.data) {
              set({
                currentUser: response.data,
                loading: false,
                success: 'User loaded successfully'
              })
              return response.data
            } else {
              set({
                loading: false,
                currentUser: null
              })
              return null
            }
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user',
              currentUser: null
            })
            return null
          }
        },

        createUser: async (userData: NewUser) => {
          set({ loading: true, error: null, success: null })

          try {
            const response = await ApiService.users.create(userData)

            if (response.success && response.data) {
              // 更新用户列表
              const { users } = get()
              set({
                users: [response.data, ...users],
                currentUser: response.data,
                loading: false,
                success: 'User created successfully'
              })
              return response.data
            } else {
              throw new Error(response.error || 'Failed to create user')
            }
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to create user',
              success: null
            })
            return null
          }
        },

        updateUser: async (id: string, userData: UserUpdate) => {
          set({ loading: true, error: null, success: null })

          try {
            const response = await ApiService.users.update(id, userData)

            if (response.success && response.data) {
              // 更新用户列表
              const { users, currentUser } = get()
              set({
                users: users.map(user =>
                  user.id === id ? response.data : user
                ),
                currentUser: currentUser?.id === id ? response.data : currentUser,
                loading: false,
                success: 'User updated successfully'
              })
              return response.data
            } else {
              throw new Error(response.error || 'Failed to update user')
            }
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to update user',
              success: null
            })
            return null
          }
        },

        deleteUser: async (id: string, softDelete = true) => {
          set({ loading: true, error: null, success: null })

          try {
            await ApiService.users.delete(id, softDelete)

            // 从列表中移除用户（软删除时可以保留）
            const { users, currentUser } = get()
            set({
              users: softDelete ? users : users.filter(user => user.id !== id),
              currentUser: currentUser?.id === id ? null : currentUser,
              loading: false,
              success: `User ${softDelete ? 'soft deleted' : 'deleted'} successfully`
            })
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to delete user',
              success: null
            })
          }
        },

        // 偏好设置操作
        updateUserPreferences: async (id: string, preferences: UserPreferences) => {
          set({ loading: true, error: null, success: null })

          try {
            const response = await ApiService.users.updatePreferences(id, preferences)

            if (response.success && response.data) {
              // 更新用户列表和当前用户
              const { users, currentUser } = get()
              set({
                users: users.map(user =>
                  user.id === id ? response.data : user
                ),
                currentUser: currentUser?.id === id ? response.data : currentUser,
                loading: false,
                success: 'User preferences updated successfully'
              })
            } else {
              throw new Error(response.error || 'Failed to update preferences')
            }
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to update preferences',
              success: null
            })
          }
        },

        // 邮箱检查
        checkEmailExists: async (email: string) => {
          try {
            const exists = await ApiService.users.checkEmailExists(email)
            return exists
          } catch (error) {
            console.error('Error checking email:', error)
            return false
          }
        },

        // 统计数据
        fetchStats: async () => {
          try {
            const response = await ApiService.users.getStats()

            if (response.success && response.data) {
              set({ stats: response.data })
            }
          } catch (error) {
            console.error('Error fetching stats:', error)
            set({ stats: null })
          }
        },

        // 状态管理
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),
        setSuccess: (success: string | null) => set({ success }),
        clearMessages: () => set({ error: null, success: null }),

        // 当前用户管理
        setCurrentUser: (user: User | null) => set({ currentUser: user }),
        clearCurrentUser: () => set({ currentUser: null }),

        // 分页和过滤
        setPagination: (pagination: Partial<PaginationState>) =>
          set((state) => ({
            pagination: { ...state.pagination, ...pagination }
          })),

        setFilters: (filters: Partial<UserListState['filters']>) =>
          set((state) => ({
            filters: { ...state.filters, ...filters }
          })),

        clearFilters: () => set({ filters: {} })
      }),
      {
        name: 'user-store',
        // 只持久化必要的状态
        partialize: (state) => ({
          currentUser: state.currentUser,
          // 不持久化 loading, error, success 等临时状态
        })
      }
    ),
    {
      name: 'UserStore'
    }
  )
)