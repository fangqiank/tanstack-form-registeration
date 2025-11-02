/**
 * 密码加密和验证工具
 * 使用 Web Crypto API 进行安全的密码哈希
 */

/**
 * 生成随机盐值
 * @param length 盐值长度，默认为16字节
 * @returns 十六进制格式的盐值字符串
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 使用 PBKDF2 算法哈希密码
 * @param password 明文密码
 * @param salt 盐值
 * @param iterations 迭代次数，默认为100000
 * @returns 哈希后的密码（十六进制格式）
 */
export async function hashPassword(
  password: string,
  salt: string,
  iterations: number = 100000
): Promise<string> {
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)
  const saltData = encoder.encode(salt)

  // 导入密码
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  // 派生密钥
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: iterations,
      hash: 'SHA-256'
    },
    importedKey,
    256 // 输出长度：256位 (32字节)
  )

  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(derivedBits))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 创建完整的密码哈希（包含盐值和迭代次数）
 * 格式：$pbkdf2$iterations$salt$hash
 * @param password 明文密码
 * @returns 完整的密码哈希字符串
 */
export async function createPasswordHash(password: string): Promise<string> {
  const salt = generateSalt()
  const iterations = 100000
  const hash = await hashPassword(password, salt, iterations)

  // 使用标准格式：$pbkdf2$iterations$salt$hash
  return `$pbkdf2$${iterations}$${salt}$${hash}`
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hashedPassword 存储的哈希密码
 * @returns 密码是否匹配
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // 解析存储的密码格式
    const parts = hashedPassword.split('$')

    if (parts.length !== 5 || parts[1] !== 'pbkdf2') {
      console.error('Invalid password hash format')
      return false
    }

    const iterations = parseInt(parts[2])
    const salt = parts[3]
    const storedHash = parts[4]

    // 使用相同的盐值和迭代次数重新哈希密码
    const computedHash = await hashPassword(password, salt, iterations)

    // 比较哈希值（使用时间恒定的比较来防止时序攻击）
    return constantTimeCompare(computedHash, storedHash)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * 时间恒定的字符串比较（防止时序攻击）
 * @param a 字符串A
 * @param b 字符串B
 * @returns 是否相等
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * 生成随机密码
 * @param length 密码长度，默认为12
 * @returns 随机密码字符串
 */
export function generateRandomPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }

  return password
}

/**
 * 检查密码强度
 * @param password 密码字符串
 * @returns 密码强度信息
 */
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0

  // 长度检查
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('密码长度至少需要8个字符')
  }

  if (password.length >= 12) {
    score += 1
  }

  // 复杂性检查
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含小写字母')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含大写字母')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含数字')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('密码需要包含特殊字符')
  }

  const isStrong = score >= 4 && password.length >= 8

  return {
    score: Math.min(score, 4),
    feedback,
    isStrong
  }
}