/**
 * Zustand 应用全局状态 Store
 *
 * 管理应用级别的状态，如认证、用户会话等
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AppState } from './types'

// App Store 接口
interface AppStore extends AppState {
  // 认证操作
  login: (token: string, user: AppState['user']) => void
  logout: () => void
  updateUser: (user: AppState['user']) => void

  // 权限检查
  hasPermission: (permission: string) => boolean
  isAuthenticated: boolean

  // 状态管理
  clearApp: () => void
}

// 创建 Zustand App Store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        user: null,
        isAuthenticated: false,
        token: null,

        // 认证操作
        login: (token: string, user: AppState['user']) => {
          set({
            token,
            user,
            isAuthenticated: true
          })
        },

        logout: () => {
          set({
            token: null,
            user: null,
            isAuthenticated: false
          })
        },

        updateUser: (user: AppState['user']) => {
          set({ user })
        },

        // 权限检查
        hasPermission: (permission: string) => {
          const { user } = get()
          if (!user) return false

          // 这里可以根据用户角色或权限进行更复杂的检查
          // 例如：return user.permissions?.includes(permission) || false
          return true
        },

        isAuthenticated: false, // 这个会通过计算属性动态更新

        // 状态管理
        clearApp: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          })
        }
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    {
      name: 'AppStore'
    }
  )
)

// 计算属性：isAuthenticated
export const useAuth = () => {
  const { user, token } = useAppStore()
  return {
    isAuthenticated: !!(user && token),
    user,
    token
  }
}