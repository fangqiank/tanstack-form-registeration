/**
 * 表单相关 Atoms
 *
 * 管理表单状态、验证、提交等
 */

import { atom } from 'jotai'

// 表单提交状态
export const formSubmittingAtom = atom<boolean>(false)

// 表单错误状态
export const formErrorsAtom = atom<Record<string, string[]>>({})

// 表单数据状态
export const formDataAtom = atom<Record<string, any>>({})

// 表单脏状态（是否有未保存的更改）
export const formDirtyAtom = atom<boolean>(false)

// 表单验证状态
export const formValidAtom = atom<boolean>(true)

// 重置表单
export const resetFormAtom = atom(
  null,
  (get, set) => {
    set(formSubmittingAtom, false)
    set(formErrorsAtom, {})
    set(formDataAtom, {})
    set(formDirtyAtom, false)
    set(formValidAtom, true)
  }
)

// 表单 Atoms
export const formAtoms = {
  formSubmittingAtom,
  formErrorsAtom,
  formDataAtom,
  formDirtyAtom,
  formValidAtom,
  resetFormAtom
}