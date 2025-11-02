/**
 * 开发工具 Atoms
 *
 * 用于开发环境调试和性能监控的原子
 */

import { atom } from 'jotai'

// 开发模式开关
export const devModeAtom = atom<boolean>(
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
)

// 性能监控开关
export const perfMonitoringAtom = atom<boolean>(false)

// 调试信息显示
export const showDebugInfoAtom = atom<boolean>(false)

// 组件渲染计数器
export const renderCounterAtom = atom<Record<string, number>>({})

// 状态变更历史
export const stateHistoryAtom = atom<Array<{
  timestamp: number
  atomName: string
  oldValue: any
  newValue: any
}>>([])

// 添加状态变更记录
export const addStateHistoryAtom = atom(
  null,
  (get, set, { atomName, oldValue, newValue }: {
    atomName: string
    oldValue: any
    newValue: any
  }) => {
    const history = get(stateHistoryAtom)
    const newEntry = {
      timestamp: Date.now(),
      atomName,
      oldValue,
      newValue
    }

    // 保留最近100条记录
    const updatedHistory = [newEntry, ...history].slice(0, 100)
    set(stateHistoryAtom, updatedHistory)
  }
)

// 增加渲染计数
export const incrementRenderCountAtom = atom(
  null,
  (get, set, componentName: string) => {
    const counters = get(renderCounterAtom)
    const newCounters = {
      ...counters,
      [componentName]: (counters[componentName] || 0) + 1
    }
    set(renderCounterAtom, newCounters)
  }
)

// 清除调试数据
export const clearDebugDataAtom = atom(
  null,
  (get, set) => {
    set(stateHistoryAtom, [])
    set(renderCounterAtom, {})
  }
)

// 开发工具 Atoms
export const devAtoms = {
  devModeAtom,
  perfMonitoringAtom,
  showDebugInfoAtom,
  renderCounterAtom,
  stateHistoryAtom,
  addStateHistoryAtom,
  incrementRenderCountAtom,
  clearDebugDataAtom
}