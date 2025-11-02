// 验证函数测试
import { validateEmail, validatePhone, validateName, validateAvatar, validatePassword } from '../__mocks__/utils'

describe('验证函数', () => {
  describe('validateEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.c'
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('应该拒绝无效的邮箱地址', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test..test@example.com',
        '',
        'test@.com',
        'test@com.',
        'test space@example.com',
        'test@example..com'
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })

    it('应该拒绝空邮箱', () => {
      expect(validateEmail('')).toBe(false)
    })

    it('应该拒绝过长的邮箱', () => {
      const longEmail = 'a'.repeat(300) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })

    it('应该拒绝过短的邮箱', () => {
      expect(validateEmail('a@b')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('应该验证有效的电话号码', () => {
      const validPhones = [
        '+86 13800138000',
        '+1 555 123 4567',
        '13800138000',
        '+44 20 7946 0123',
        '1234567',
        '+123456789012345'
      ]

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true)
      })
    })

    it('应该拒绝无效的电话号码', () => {
      const invalidPhones = [
        'abc123',
        '123',
        '+',
        '+abc',
        '',
        '0000000000000000', // 太长
        '12 34 56' // 太短
      ]

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false)
      })
    })

    it('应该正确处理带格式的电话号码', () => {
      const formattedPhones = [
        { input: '+86 (138) 0013-8000', expected: true },
        { input: '1-555-123-4567', expected: true },
        { input: '(555) 123-4567', expected: true }
      ]

      formattedPhones.forEach(({ input, expected }) => {
        expect(validatePhone(input)).toBe(expected)
      })
    })
  })

  describe('validateName', () => {
    it('应该验证有效的姓名', () => {
      const validNames = [
        'John',
        'Mary Jane',
        'John Smith',
        'O\'Connor',
        'Jean-Claude',
        '张三',
        '李四',
        'Anna Maria'
      ]

      validNames.forEach(name => {
        expect(validateName(name)).toBe(true)
      })
    })

    it('应该拒绝无效的姓名', () => {
      const invalidNames = [
        '',
        '123',
        'John123',
        'John@Smith',
        'John Smith!',
        '   ',
        'John\nSmith',
        'John\tSmith'
      ]

      invalidNames.forEach(name => {
        expect(validateName(name)).toBe(false)
      })
    })

    it('应该处理空格', () => {
      expect(validateName('John Smith')).toBe(true)
      expect(validateName(' John Smith ')).toBe(true)
    })
  })

  describe('validateAvatar', () => {
    const createMockFile = (type: string, size: number): File => {
      const mockFile = new File(['content'], 'test.jpg', { type })
      Object.defineProperty(mockFile, 'size', { value: size })
      return mockFile
    }

    it('应该验证有效的头像文件', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      const validSize = 1024 * 1024 // 1MB

      validTypes.forEach(type => {
        const file = createMockFile(type, validSize)
        expect(validateAvatar(file)).toBeUndefined())
      })
    })

    it('应该拒绝过大的文件', () => {
      const largeFile = createMockFile('image/jpeg', 6 * 1024 * 1024) // 6MB
      expect(validateAvatar(largeFile)).toBe('头像文件大小不能超过5MB')
    })

    it('应该拒绝不支持的文件类型', () => {
      const invalidTypes = ['application/pdf', 'text/plain', 'video/mp4']

      invalidTypes.forEach(type => {
        const file = createMockFile(type, 1024)
        expect(validateAvatar(file)).toBe('头像只支持 JPG、PNG、GIF、WebP 格式')
      })
    })

    it('应该接受null值', () => {
      expect(validateAvatar(null)).toBeUndefined()
    })

    it('应该接受undefined值', () => {
      expect(validateAvatar(undefined)).toBeUndefined()
    })
  })

  describe('validatePassword', () => {
    it('应该验证强密码', () => {
      const strongPassword = 'StrongP@ssw0rd123'
      const result = validatePassword(strongPassword)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝弱密码 - 太短', () => {
      const shortPassword = 'Short1'
      const result = validatePassword(shortPassword)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码至少需要8个字符')
    })

    it('应该拒绝弱密码 - 缺少小写字母', () => {
      const noLowercase = 'STRONG@123'
      const result = validatePassword(noLowercase)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个小写字母')
    })

    it('应该拒绝弱密码 - 缺少大写字母', () => {
      const noUppercase = 'weak@123'
      const result = validatePassword(noUppercase)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个大写字母')
    })

    it('应该拒绝弱密码 - 缺少数字', () => {
      const noNumbers = 'WeakPassword'
      const result = validatePassword(noNumbers)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个数字')
    })

    it('应该拒绝弱密码 - 缺少特殊字符', () => {
      const noSpecial = 'WeakPassword123'
      const result = validatePassword(noSpecial)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('密码必须包含至少一个特殊字符 (@$!%*?&)')
    })

    it('应该识别中等强度密码', () => {
      const mediumPassword = 'Medium123'
      const result = validatePassword(mediumPassword)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.length).toBeLessThan(5) // 不是所有错误都出现
    })
  })
})