// Jest测试环境配置
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Mock TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Supabase client
jest.mock('../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          data: [],
        })),
        data: [],
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
          data: [],
        })),
        data: [],
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
        data: [],
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn().mockImplementation((blob) => {
    setTimeout(() => {
      // 模拟文件读取完成
      const mockReader = {
        result: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        readyState: 2,
        onload: null,
        onerror: null,
      }
      if ((mockReader as any).onload) {
        (mockReader as any).onload({ target: mockReader })
      }
    }, 0)
    return mockReader
  }),
  result: '',
  readyState: 2,
  onload: null,
  onerror: null,
})) as any

// 清理函数
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear()
})