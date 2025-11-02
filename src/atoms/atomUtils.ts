/**
 * Atom 工具函数
 *
 * 提供创建和管理原子的通用工具函数
 */

import { atom } from 'jotai'

// 创建带重置功能的原子
export const atomWithReset = <T>(initialValue: T) => {
  const baseAtom = atom<T>(initialValue)
  const resetAtom = atom(
    null,
    (get, set) => {
      set(baseAtom, initialValue)
    }
  )
  return [baseAtom, resetAtom] as const
}

// 创建带本地存储的原子
export const atomWithLocalStorage = <T>(key: string, initialValue: T) => {
  const storedValue = typeof window !== 'undefined'
    ? localStorage.getItem(key)
    : null

  const initial = storedValue ? JSON.parse(storedValue) : initialValue

  const baseAtom = atom<T>(initial)

  const persistedAtom = atom(
    (get) => get(baseAtom),
    (get, set, newValue: T) => {
      set(baseAtom, newValue)
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    }
  )

  return persistedAtom
}

// 创建带会话存储的原子
export const atomWithSessionStorage = <T>(key: string, initialValue: T) => {
  const storedValue = typeof window !== 'undefined'
    ? sessionStorage.getItem(key)
    : null

  const initial = storedValue ? JSON.parse(storedValue) : initialValue

  const baseAtom = atom<T>(initial)

  const sessionAtom = atom(
    (get) => get(baseAtom),
    (get, set, newValue: T) => {
      set(baseAtom, newValue)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(key, JSON.stringify(newValue))
      }
    }
  )

  return sessionAtom
}

// 创建异步原子
export const atomWithAsync = <T>(fetcher: () => Promise<T>) => {
  const dataAtom = atom<T | null>(null)
  const loadingAtom = atom<boolean>(true)
  const errorAtom = atom<string | null>(null)

  const asyncAtom = atom(
    null,
    async (get, set) => {
      set(loadingAtom, true)
      try {
        const data = await fetcher()
        set(dataAtom, data)
        set(loadingAtom, false)
        set(errorAtom, null)
        return data
      } catch (error) {
        set(errorAtom, error instanceof Error ? error.message : 'Unknown error')
        set(loadingAtom, false)
        throw error
      }
    }
  )

  return { asyncAtom, dataAtom, loadingAtom, errorAtom }
}

// 工具函数集合
export const atomUtils = {
  atomWithReset,
  atomWithLocalStorage,
  atomWithSessionStorage,
  atomWithAsync
}