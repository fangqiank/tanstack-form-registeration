/**
 * Hooks 导出文件
 *
 * 集中导出所有自定义 hooks，包括 Zustand 和 Jotai 的 hooks
 */

// Zustand hooks
export { useAppStore, useAuth } from '../stores/useAppStore'
export { useUserStore } from '../stores/useUserStore'
export { useUIStore } from '../stores/useUIStore'

// Jotai hooks
export { useAtom, useAtomValue, useSetAtom } from 'jotai'

// Jotai user hooks
export {
  currentUserAtom,
  isAuthenticatedAtom,
  totalUsersAtom,
  genderDistributionAtom,
  activeUsersAtom,
  createUserAtom,
  updateUserAtom,
  deleteUserAtom,
  checkEmailExistsAtom
} from '../atoms/userAtoms'

// Jotai UI hooks
export {
  sidebarOpenAtom,
  darkModeAtom,
  currentPageAtom,
  notificationsAtom,
  toggleSidebarAtom,
  toggleDarkModeAtom,
  showSuccessAtom,
  showErrorAtom,
  addNotificationAtom,
  removeNotificationAtom
} from '../atoms/uiAtoms'

// 便捷导出
export { atom } from 'jotai'