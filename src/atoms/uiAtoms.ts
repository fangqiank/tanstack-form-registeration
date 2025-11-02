/**
 * Jotai UI 状态管理 Atoms
 *
 * 管理界面相关的原子状态，如侧边栏、主题、通知等
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { UIState } from '../stores/types'

// ====== 基础 UI 原子 ======

// 侧边栏状态（持久化）
export const sidebarOpenAtom = atomWithStorage<boolean>('jotai-sidebar-open', false)

// 主题状态（持久化）
export const darkModeAtom = atomWithStorage<boolean>('jotai-dark-mode', false)

// 当前页面状态
export const currentPageAtom = atom<string>('dashboard')

// 通知列表状态
export const notificationsAtom = atom<UIState['notifications']>([])

// ====== 派生 UI 原子 ======

// 侧边栏类名
export const sidebarClassNameAtom = atom(
  (get) => {
    const isOpen = get(sidebarOpenAtom)
    const darkMode = get(darkModeAtom)

    const baseClasses = 'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out'
    const openClasses = isOpen ? 'translate-x-0' : '-translate-x-full'
    const themeClasses = darkMode ? 'dark:bg-gray-800' : 'bg-white'

    return `${baseClasses} ${openClasses} ${themeClasses}`
  }
)

// 主内容区域类名
export const mainContentClassNameAtom = atom(
  (get) => {
    const sidebarOpen = get(sidebarOpenAtom)
    const darkMode = get(darkModeAtom)

    const transitionClass = 'transition-all duration-300 ease-in-out'
    const marginClass = sidebarOpen ? 'ml-64' : 'ml-0'
    const themeClass = darkMode ? 'dark:bg-gray-900 dark:text-white' : 'bg-gray-50 text-gray-900'

    return `${transitionClass} ${marginClass} ${themeClass}`
  }
)

// 主题切换图标
export const themeIconAtom = atom(
  (get) => {
    const darkMode = get(darkModeAtom)
    return darkMode ? '🌙️' : '☀️'
  }
)

// 侧边栏切换图标
export const sidebarIconAtom = atom(
  (get) => {
    const sidebarOpen = get(sidebarOpenAtom)
    return sidebarOpen ? '✕️' : '☰'
  }
)

// 通知数量
export const notificationCountAtom = atom(
  (get) => {
    const notifications = get(notificationsAtom)
    return notifications.length
  }
)

// 未读通知数量
export const unreadNotificationCountAtom = atom(
  (get) => {
    const notifications = get(notificationsAtom)
    return notifications.filter(n => !n.read).length
  }
)

// 页面标题
export const pageTitleAtom = atom(
  (get) => {
    const currentPage = get(currentPageAtom)
    const titles: Record<string, string> = {
      dashboard: '仪表板',
      users: '用户管理',
      profile: '个人资料',
      settings: '系统设置',
      analytics: '数据分析'
    }
    return titles[currentPage] || '应用'
  }
)

// ====== UI 操作原子 ======

// 切换侧边栏
export const toggleSidebarAtom = atom(
  null,
  (get, set) => {
    const current = get(sidebarOpenAtom)
    set(sidebarOpenAtom, !current)
  }
)

// 打开侧边栏
export const openSidebarAtom = atom(
  null,
  (get, set) => {
    set(sidebarOpenAtom, true)
  }
)

// ��闭侧边栏
export const closeSidebarAtom = atom(
  null,
  (get, set) => {
    set(sidebarOpenAtom, false)
  }
)

// 切换主题
export const toggleDarkModeAtom = atom(
  null,
  (get, set) => {
    const current = get(darkModeAtom)
    set(darkModeAtom, !current)

    // 应用主题到 document
    if (!current) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
)

// 设置主题
export const setDarkModeAtom = atom(
  null,
  (get, set, darkMode: boolean) => {
    set(darkModeAtom, darkMode)

    // 应用主题到 document
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
)

// 设置当前页面
export const setCurrentPageAtom = atom(
  null,
  (get, set, page: string) => {
    set(currentPageAtom, page)
  }
)

// ====== 通知管理原子 ======

// 添加通知
export const addNotificationAtom = atom(
  null,
  (get, set, notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
      autoClose: notification.autoClose !== false
    }

    set(notificationsAtom, (prev) => [newNotification, ...prev])

    // 自动关闭通知
    if (newNotification.autoClose) {
      setTimeout(() => {
        set(removeNotificationAtom, newNotification.id)
      }, 5000)
    }
  }
)

// 移除通知
export const removeNotificationAtom = atom(
  null,
  (get, set, id: string) => {
    set(notificationsAtom, (prev) =>
      prev.filter((notification) => notification.id !== id)
    )
  }
)

// 标记通知为已读
export const markNotificationAsReadAtom = atom(
  null,
  (get, set, id: string) => {
    set(notificationsAtom, (prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }
)

// 标记所有通知为已读
export const markAllNotificationsAsReadAtom = atom(
  null,
  (get, set) => {
    set(notificationsAtom, (prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    )
  }
)

// 清除所有通知
export const clearNotificationsAtom = atom(
  null,
  (get, set) => {
    set(notificationsAtom, [])
  }
)

// ====== 便捷通知方法原子 ======

// 显示成功通知
export const showSuccessAtom = atom(
  null,
  (get, set, message: string) => {
    get().addNotificationAtom({
      type: 'success',
      message,
      autoClose: true
    })
  }
)

// 显示错误通知
export const showErrorAtom = atom(
  null,
  (get, set, message: string) => {
    get().addNotificationAtom({
      type: 'error',
      message,
      autoClose: false
    })
  }
)

// 显示信息通知
export const showInfoAtom = atom(
  null,
  (get, set, message: string) => {
    get().addNotificationAtom({
      type: 'info',
      message,
      autoClose: true
    })
  }
)

// 显示警告通知
export const showWarningAtom = atom(
  null,
  (get, set, message: string) => {
    get().addNotificationAtom({
      type: 'warning',
      message,
      autoClose: true
    })
  }
)

// ====== 动画状态原子 ======

// 页面切换动画状态
export const isPageTransitioningAtom = atom<boolean>(false)

// 开始页面切换
export const startPageTransitionAtom = atom(
  null,
  (get, set) => {
    set(isPageTransitioningAtom, true)
  }
)

// 结束页面切换
export const endPageTransitionAtom = atom(
  null,
  (get, set) => {
    setTimeout(() => {
      set(isPageTransitioningAtom, false)
    }, 300)
  }
)

// ====== 响应式设计原子 ======

// 移动端侧边栏状态
export const isMobileSidebarOpenAtom = atom<boolean>(false)

// 切换移动端侧边栏
export const toggleMobileSidebarAtom = atom(
  null,
  (get, set) => {
    const current = get(isMobileSidebarOpenAtom)
    set(isMobileSidebarOpenAtom, !current)
  }
)

// 屏幕尺寸
export const screenSizeAtom = atom<'mobile' | 'tablet' | 'desktop'>('desktop')

// 更新屏幕尺寸
export const updateScreenSizeAtom = atom(
  null,
  (get, set) => {
    const width = window.innerWidth
    let size: 'mobile' | 'tablet' | 'desktop' = 'desktop'

    if (width < 768) {
      size = 'mobile'
    } else if (width < 1024) {
      size = 'tablet'
    } else {
      size = 'desktop'
    }

    set(screenSizeAtom, size)

    // 移动端自动关闭侧边栏
    if (size === 'mobile') {
      set(sidebarOpenAtom, false)
    }
  }
)

// 是否为移动端
export const isMobileAtom = atom(
  (get) => get(screenSizeAtom) === 'mobile'
)

// 是否为平板端
export const isTabletAtom = atom(
  (get) => get(screenSizeAtom) === 'tablet'
)

// 是否为桌面端
export const isDesktopAtom = atom(
  (get) => get(screenSizeAtom) === 'desktop'
)

// 导出 UI atoms 组
export const uiAtoms = {
  // 状态原子
  sidebarOpenAtom,
  darkModeAtom,
  currentPageAtom,
  notificationsAtom,

  // 派生原子
  sidebarClassNameAtom,
  mainContentClassNameAtom,
  themeIconAtom,
  sidebarIconAtom,
  notificationCountAtom,
  unreadNotificationCountAtom,
  pageTitleAtom,

  // 操作原子
  toggleSidebarAtom,
  openSidebarAtom,
  closeSidebarAtom,
  toggleDarkModeAtom,
  setDarkModeAtom,
  setCurrentPageAtom,

  // 通知管理
  addNotificationAtom,
  removeNotificationAtom,
  markNotificationAsReadAtom,
  markAllNotificationsAsReadAtom,
  clearNotificationsAtom,

  // 便捷方法
  showSuccessAtom,
  showErrorAtom,
  showInfoAtom,
  showWarningAtom,

  // 动画状态
  isPageTransitioningAtom,
  startPageTransitionAtom,
  endPageTransitionAtom,

  // 响应式设计
  isMobileSidebarOpenAtom,
  toggleMobileSidebarAtom,
  screenSizeAtom,
  updateScreenSizeAtom,
  isMobileAtom,
  isTabletAtom,
  isDesktopAtom
}