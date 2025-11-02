// 密码加密工具测试
import { createPasswordHash, verifyPassword } from '../../utils/password'

// Mock the crypto module
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('mock_salt', 'utf8')),
  pbkdf2: jest.fn().mockImplementation((password, salt, iterations, keylen, digest, callback) => {
    // 模拟PBKDF2加密
    setTimeout(() => {
      callback(null, Buffer.from('mock_hashed_password', 'utf8'))
    }, 0)
  }),
}))

describe('密码加密工具', () => {
  describe('createPasswordHash', () => {
    it('应该能够加密密码', async () => {
      const password = 'TestPassword123'
      const result = await createPasswordHash(password)

      expect(result).toHaveProperty('hash')
      expect(result).toHaveProperty('salt')
      expect(typeof result.hash).toBe('string')
      expect(typeof result.salt).toBe('string')
      expect(result.hash.length).toBeGreaterThan(0)
      expect(result.salt.length).toBeGreaterThan(0)
    })

    it('相同密码应该产生不同的哈希值', async () => {
      const password = 'TestPassword123'
      const result1 = await createPasswordHash(password)
      const result2 = await createPasswordHash(password)

      expect(result1.hash).not.toBe(result2.hash)
      expect(result1.salt).not.toBe(result2.salt)
    })

    it('不同密码应该产生不同的哈希值', async () => {
      const result1 = await createPasswordHash('Password1')
      const result2 = await createPasswordHash('Password2')

      expect(result1.hash).not.toBe(result2.hash)
    })

    it('空密码应该也能加密', async () => {
      const password = ''
      const result = await createPasswordHash(password)

      expect(result).toHaveProperty('hash')
      expect(result).toHaveProperty('salt')
    })

    it('特殊字符密码应该能正常加密', async () => {
      const password = 'Test!@#$%^&*()'
      const result = await createPasswordHash(password)

      expect(result).toHaveProperty('hash')
      expect(result).toHaveProperty('salt')
    })
  })

  describe('verifyPassword', () => {
    let passwordHash: { hash: string; salt: string }

    beforeEach(async () => {
      passwordHash = await createPasswordHash('TestPassword123')
    })

    it('正确密码应该验证��过', async () => {
      const password = 'TestPassword123'
      const isValid = await verifyPassword(password, passwordHash.hash, passwordHash.salt)

      expect(isValid).toBe(true)
    })

    it('错误密码应该验证失败', async () => {
      const wrongPassword = 'WrongPassword'
      const isValid = await verifyPassword(wrongPassword, passwordHash.hash, passwordHash.salt)

      expect(isValid).toBe(false)
    })

    it('空密码应该验证失败', async () => {
      const emptyPassword = ''
      const isValid = await verifyPassword(emptyPassword, passwordHash.hash, passwordHash.salt)

      expect(isValid).toBe(false)
    })

    it('不同的哈希值应该验证失败', async () => {
      const differentHash = await createPasswordHash('DifferentPassword')
      const isValid = await verifyPassword('TestPassword123', differentHash.hash, differentHash.salt)

      expect(isValid).toBe(false)
    })
  })

  describe('密码安全性', () => {
    it('哈希值应该是固定长度', async () => {
      const passwords = ['short', 'medium-length-password', 'very-long-password-with-many-characters-123456789']

      for (const password of passwords) {
        const result = await createPasswordHash(password)
        expect(result.hash.length).toBe(64) // SHA256输出长度
      }
    })

    it('盐值应该是固定长度', async () => {
      const result = await createPasswordHash('TestPassword123')
      expect(result.salt.length).toBe(16) // 128位
    })

    it('加密过程应该是确定性的（给定相同的输入）', async () => {
      const password = 'TestPassword123'
      const result1 = await createPasswordHash(password)
      const result2 = await createPasswordHash(password)

      // 虽然整体结果是随机的，但结构应该一致
      expect(typeof result1.hash).toBe(typeof result2.hash)
      expect(typeof result1.salt).toBe(typeof result2.salt)
      expect(result1.hash.length).toBe(result2.hash.length)
      expect(result1.salt.length).toBe(result2.salt.length)
    })
  })
})