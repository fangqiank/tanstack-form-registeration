/**
 * API 相关 Atoms
 *
 * 管理 API 请求状态、错误处理等
 */

import { atom } from 'jotai'

// API 加载状态
export const apiLoadingAtom = atom<boolean>(false)

// API 错误状态
export const apiErrorAtom = atom<string | null>(null)

// API 响应缓存
export const apiCacheAtom = atom<Record<string, any>>({})

// 请求计数器（用于加载指示器）
export const requestCountAtom = atom<number>(0)

// API 状态管理
export const apiAtoms = {
  apiLoadingAtom,
  apiErrorAtom,
  apiCacheAtom,
  requestCountAtom
}