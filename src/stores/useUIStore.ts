/**
 * Zustand UI 状态 Store
 *
 * 管理 UI 相关状态，如侧边栏、主题、通知等
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { UIState } from './types'

// UI Store 接口
interface UIStore extends UIState {
  // 侧边栏控制
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void

  // 主题控制
  toggleDarkMode: () => void
  setDarkMode: (darkMode: boolean) => void

  // 页面导航
  setCurrentPage: (page: string) => void

  // 通知管理
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // 便捷方法
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

// 创建 Zustand UI Store
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        sidebarOpen: false,
        darkMode: false,
        currentPage: 'dashboard',
        notifications: [],

        // 侧边栏控制
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        openSidebar: () => set({ sidebarOpen: true }),
        closeSidebar: () => set({ sidebarOpen: false }),

        // 主题控制
        toggleDarkMode: () =>
          set((state) => ({ darkMode: !state.darkMode })),

        setDarkMode: (darkMode: boolean) => set({ darkMode }),

        // 页面导航
        setCurrentPage: (page: string) => set({ currentPage: page }),

        // 通知管理
        addNotification: (notification) => {
          const newNotification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: Date.now(),
            autoClose: notification.autoClose !== false
          }

          set((state) => ({
            notifications: [newNotification, ...state.notifications]
          }))

          // 自动关闭通知
          if (newNotification.autoClose) {
            setTimeout(() => {
              get().removeNotification(newNotification.id)
            }, 5000)
          }
        },

        removeNotification: (id: string) =>
          set((state) => ({
            notifications: state.notifications.filter(
              (notification) => notification.id !== id
            )
          })),

        clearNotifications: () => set({ notifications: [] }),

        // 便捷方法
        showSuccess: (message: string) =>
          get().addNotification({
            type: 'success',
            message,
            autoClose: true
          }),

        showError: (message: string) =>
          get().addNotification({
            type: 'error',
            message,
            autoClose: false
          }),

        showInfo: (message: string) =>
          get().addNotification({
            type: 'info',
            message,
            autoClose: true
          }),

        showWarning: (message: string) =>
          get().addNotification({
            type: 'warning',
            message,
            autoClose: true
          })
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          darkMode: state.darkMode,
          sidebarOpen: state.sidebarOpen
        })
      }
    ),
    {
      name: 'UIStore'
    }
  )
)