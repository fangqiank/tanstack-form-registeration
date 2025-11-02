// Supabase客户端Mock
export const mockSupabaseClient = {
  from: jest.fn((table: string) => {
    const mockResponse = {
      // 模拟用户表数据
      'test_users': {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            }),
            data: []
          })),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          }),
          data: []
        }),
        insert: jest.fn().mockResolvedValue({
          data: {
            id: 'test-user-id',
            email: 'test@example.com',
            first_name: '测试',
            last_name: '用户',
            created_at: new Date().toISOString()
          },
          error: null
        }),
        update: jest.fn().mockResolvedValue({
          data: {},
          error: null
        }),
        delete: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      },

      // 模拟用户偏好表数据
      'test_user_preferences': {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null
            }),
            data: []
          })),
          data: []
        }),
        insert: jest.fn().mockResolvedValue({
          data: {
            id: 'test-pref-id',
            user_id: 'test-user-id',
            newsletter: true,
            notifications: true
          },
          error: null
        })
      }
    }

    return mockResponse[table] || {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: `Table ${table} not found` }
          }),
          data: []
        })),
        data: []
      })),
      insert: jest.fn().mockRejectedValue(new Error(`Table ${table} not found`)),
      update: jest.fn().mockRejectedValue(new Error(`Table ${table} not found`)),
      delete: jest.fn().mockRejectedValue(new Error(`Table ${table} not found`))
    }
  }),

  auth: {
    signUp: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh-token'
        }
      },
      error: null
    }),
    signIn: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh-token'
        }
      },
      error: null
    }),
    signOut: jest.fn().mockResolvedValue({
      error: null
    })
  },

  storage: {
    from: jest.fn().mockResolvedValue({
      data: {
        signedURL: 'https://example.com/test-image.jpg'
      },
      error: null
    })
  }
}

// 测试用例数据
export const testUsers = {
  validUser: {
    id: 'valid-user-id',
    email: 'test@example.com',
    password: '$pbkdf2$100000$test_salt$test_hash',
    first_name: '测试',
    last_name: '用户',
    phone: '+86 13800138000',
    birth_date: '1990-01-01',
    gender: 'male',
    bio: '这是一个测试用户',
    avatar_url: 'data:image/png;base64,test_image_data',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },

  newUser: {
    id: 'new-user-id',
    email: 'new@example.com',
    password: '$pbkdf2$100000$new_salt$new_hash',
    first_name: '新',
    last_name: '用户',
    phone: null,
    birth_date: null,
    gender: null,
    bio: null,
    avatar_url: null,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  },

  existingUser: {
    id: 'existing-user-id',
    email: 'existing@example.com',
    password: '$pbkdf2$100000$existing_salt$existing_hash',
    first_name: '已存在',
    last_name: '用户',
    created_at: '2022-01-01T00:00:00Z'
  }
}

export const testUserPreferences = {
  validPreferences: {
    id: 'test-pref-id',
    user_id: 'test-user-id',
    newsletter: true,
    notifications: true,
    privacy_public: false,
    marketing_emails: false,
    created_at: '2023-01-01T00:00:00Z'
  }
}

// 设置Mock响应的辅助函数
export const mockUserExists = (email: string, exists: boolean = true) => {
  const mockTable = mockSupabaseClient.from('test_users')
  const mockSelect = mockTable.select()
  const mockEq = mockSelect.eq as jest.Mock

  if (exists) {
    mockEq.mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { ...testUsers.existingUser, email }
      })
    })
  } else {
    mockEq.mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: null
      })
    })
  }
}

export const mockCreateUser = (userData: any, success: boolean = true) => {
  const mockTable = mockSupabaseClient.from('test_users')
  const mockInsert = mockTable.insert as jest.Mock

  if (success) {
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { ...testUsers.newUser, ...userData }
        })
      })
    })
  } else {
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockRejectedValue(new Error('Database error'))
      })
    })
  }
}

export const mockUpdateUserAvatar = (userId: string, avatarUrl: string, success: boolean = true) => {
  const mockTable = mockSupabaseClient.from('test_users')
  const mockUpdate = mockTable.update as jest.Mock

  if (success) {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        data: { avatar_url: avatarUrl }
      })
    })
  } else {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        error: { message: 'Update failed' }
      })
    })
  }
}

// 重置所有Mock
export const resetAllMocks = () => {
  jest.clearAllMocks()
}