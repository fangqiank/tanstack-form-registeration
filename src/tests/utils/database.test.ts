// 数据库操作测试
import { userDatabase } from '../../utils/database'
import { mockSupabaseClient, testUsers, mockUserExists, mockCreateUser, mockUpdateUserAvatar } from '../__mocks__/supabase'

// Mock the database module
jest.mock('../../utils/supabase-database', () => ({
  userDatabase: mockSupabaseClient
}))

describe('数据库操作', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createUser', () => {
    it('应该能够创建新用户', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: '新',
        lastName: '用户',
        phone: '+86 13800138000'
      }

      mockCreateUser(userData, true)

      const result = await userDatabase.createUser(userData)

      expect(result).toEqual(
        expect.objectContaining({
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName
        })
      )
    })

    it('应该处理创建用户失败的情况', async () => {
      const userData = {
        email: 'fail@example.com',
        password: 'Password123!',
        firstName: '失败',
        lastName: '用户'
      }

      mockCreateUser(userData, false)

      await expect(userDatabase.createUser(userData)).rejects.toThrow()
    })
  })

  describe('getUserByEmail', () => {
    it('应该能够根据邮箱查找用户', async () => {
      const email = 'test@example.com'
      mockUserExists(email, true)

      const result = await userDatabase.getUserByEmail(email)

      expect(result).toEqual(
        expect.objectContaining({
          email: email
        })
      )
    })

    it('应该处理用户不存在的情况', async () => {
      const email = 'nonexistent@example.com'
      mockUserExists(email, false)

      const result = await userDatabase.getUserByEmail(email)

      expect(result).toBeNull()
    })

    it('应该处理查询错误', async () => {
      const email = 'error@example.com'
      const mockTable = mockSupabaseClient.from('test_users')
      const mockSelect = mockTable.select()
      mockSelect.mockReturnValue({
        eq: jest.fn().mockRejectedValue(new Error('Database error'))
      })

      const result = await userDatabase.getUserByEmail(email)

      expect(result).toBeNull()
    })
  })

  describe('verifyUser', () => {
    it('应该验证用户凭据', async () => {
      const email = 'test@example.com'
      const password = 'Test123!@#'

      // Mock用户存在和密码验证
      mockUserExists(email, true)
      const mockTable = mockSupabaseClient.from('test_users')
      const mockSelect = mockTable.select()
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...testUsers.validUser, email }
          })
        })
      })

      const result = await userDatabase.verifyUser(email, password)

      expect(result).toEqual(
        expect.objectContaining({
          email: email
        })
      )
    })

    it('应该拒绝无效的密码', async () => {
      const email = 'test@example.com'
      const wrongPassword = 'WrongPassword'

      mockUserExists(email, true)
      const mockTable = mockSupabaseClient.from('test_users')
      const mockSelect = mockTable.select()
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: testUsers.validUser
          })
        })
      })

      const result = await userDatabase.verifyUser(email, wrongPassword)

      expect(result).toBeNull()
    })

    it('应该处理用户不存在的情况', async () => {
      const email = 'nonexistent@example.com'
      const password = 'Test123!@#'

      mockUserExists(email, false)

      const result = await userDatabase.verifyUser(email, password)

      expect(result).toBeNull()
    })
  })

  describe('checkEmailExists', () => {
    it('应该检查邮箱是否已存在', async () => {
      const existingEmail = 'existing@example.com'
      const mockFetch = global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 'test-id' }])
      })

      const result = await userDatabase.checkEmailExists(existingEmail)

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(existingEmail),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      )
    })

    it('应该返回false对于不存在的邮箱', async () => {
      const newEmail = 'new@example.com'
      const mockFetch = global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })

      const result = await userDatabase.checkEmailExists(newEmail)

      expect(result).toBe(false)
    })

    it('应该处理网络错误', async () => {
      const mockFetch = global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const result = await userDatabase.checkEmailExists('test@example.com')

      expect(result).toBe(false)
    })
  })

  describe('createUserPreferences', () => {
    it('应该创建用户偏好设置', async () => {
      const preferences = {
        userId: 'test-user-id',
        newsletter: true,
        notifications: true,
        privacyPublic: false,
        marketingEmails: false
      }

      const mockTable = mockSupabaseClient.from('test_user_preferences')
      const mockInsert = mockTable.insert as jest.Mock
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'test-pref-id', ...preferences }
          })
        })
      })

      const result = await userDatabase.createUserPreferences(preferences)

      expect(result).toEqual(
        expect.objectContaining({
          user_id: preferences.userId,
          newsletter: preferences.newsletter
        })
      )
    })
  })

  describe('updateUserAvatar', () => {
    it('应该更新用户头像', async () => {
      const userId = 'test-user-id'
      const avatarUrl = 'data:image/png;base64,test_image_data'

      mockUpdateUserAvatar(userId, avatarUrl, true)

      const result = await userDatabase.updateUserAvatar(userId, avatarUrl)

      expect(result).toBeUndefined() // 成功时返回undefined
    })

    it('应该处理更新头像失败的情况', async () => {
      const userId = 'test-user-id'
      const avatarUrl = 'data:image/png;base64,test_image_data'

      mockUpdateUserAvatar(userId, avatarUrl, false)

      await expect(userDatabase.updateUserAvatar(userId, avatarUrl)).rejects.toThrow()
    })
  })

  describe('getUserStats', () => {
    it('应该获取用户统计信息', async () => {
      const userId = 'test-user-id'
      const mockTable = mockSupabaseClient.from('test_users')
      const mockSelect = mockTable.select
      mockSelect.mockReturnValue({
        count: jest.fn().mockResolvedValue(5)
      })

      const result = await userDatabase.getUserStats(userId)

      expect(result).toEqual({
        totalUsers: 5,
        preferencesCount: 0
      })
    })

    it('应该处理统计获取失败', async () => {
      const userId = 'test-user-id'
      const mockTable = mockSupabaseClient.from('test_users')
      mockTable.select.mockReturnValue({
        count: jest.fn().mockRejectedValue(new Error('Database error'))
      })

      await expect(userDatabase.getUserStats(userId)).rejects.toThrow()
    })
  })
})