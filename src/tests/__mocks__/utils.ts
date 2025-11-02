// 工具函数Mock

// Mock密码加密函数
export const mockPasswordHash = 'mocked_password_hash'
export const mockPasswordSalt = 'mocked_salt'

export const mockCreatePasswordHash = jest.fn().mockResolvedValue({
  hash: mockPasswordHash,
  salt: mockPasswordSalt
})

export const mockVerifyPassword = jest.fn().mockImplementation((password: string, hash: string) => {
  // 模拟密码验证
  const testPassword = 'Test123!@#'
  return password === testPassword && hash.includes(mockPasswordHash)
})

// Mock验证函数
export const mockValidateEmail = jest.fn().mockImplementation((email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length >= 5 && email.length <= 254
})

export const mockValidatePhone = jest.fn().mockImplementation((phone: string) => {
  const phoneRegex = /^\+?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''))
})

export const mockValidateName = jest.fn().mockImplementation((name: string) => {
  const nameRegex = /^[a-zA-Z\s\-']+$/
  return nameRegex.test(name) && name.trim().length > 0
})

// Mock文件验证
export const mockValidateAvatar = jest.fn().mockImplementation((file: File) => {
  if (!file) return undefined

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return '头像只支持 JPG、PNG、GIF、WebP 格式'
  }

  // 检查文件大小 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return '头像文件大小不能超过5MB'
  }

  return undefined
})

// Mock异步验证函数
export const mockCheckEmailUniqueness = jest.fn().mockImplementation(async (email: string) => {
  // 模拟异步检查邮箱唯一性
  await new Promise(resolve => setTimeout(resolve, 100))

  const existingEmails = ['existing@example.com', 'test@example.com']
  if (existingEmails.includes(email)) {
    return '该邮箱已被注册'
  }

  return undefined
})

// Mock文件读取
export const mockFileReader = {
  readAsDataURL: jest.fn().mockImplementation((file: File) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
      }, 10)
    })
  })
}

// 重置所有Mock
export const resetAllMocks = () => {
  jest.clearAllMocks()
}