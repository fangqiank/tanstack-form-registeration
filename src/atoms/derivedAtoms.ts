/**
 * 派生 Atoms (Derived Atoms)
 *
 * 基于其他原子计算得出的派生状态
 */

import { atom } from 'jotai'
import { userAtoms } from './userAtoms'
import { uiAtoms } from './uiAtoms'

// 应用是否就绪（所有必要数据已加载）
export const appReadyAtom = atom(
  (get) => {
    const loading = get(userAtoms.loadingAtom)
    const apiLoading = get(uiAtoms.isPageTransitioningAtom)
    return !loading && !apiLoading
  }
)

// 当前用户是否有未保存的更改
export const hasUnsavedChangesAtom = atom(
  (get) => {
    const currentUser = get(userAtoms.currentUserAtom)
    // 简化版本：实际应用中需要保存原始用户数据进行比较
    return false
  }
)

// 应用整体状态统计
export const appStatsAtom = atom(
  (get) => {
    const totalUsers = get(userAtoms.totalUsersAtom)
    const activeUsers = get(userAtoms.activeUsersAtom)
    const notificationCount = get(uiAtoms.notificationCountAtom)
    const isDarkMode = get(uiAtoms.darkModeAtom)

    return {
      totalUsers,
      activeUsers,
      notificationCount,
      isDarkMode,
      ready: get(appReadyAtom)
    }
  }
)

// 用户搜索结果
export const searchResultsAtom = atom(
  (get) => {
    const users = get(userAtoms.filteredUsersAtom)
    const searchTerm = '' // 这里可以从搜索框原子获取
    if (!searchTerm) return []

    return users.filter(user =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
)

// 派生 Atoms
export const derivedAtoms = {
  appReadyAtom,
  hasUnsavedChangesAtom,
  appStatsAtom,
  searchResultsAtom
}