import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { userDatabase } from '../utils/supabase-database'
import { verifyPassword } from '../utils/password'
import { useAuth } from '../hooks/useAuth.tsx'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      setError(null)

      try {
        // 首先通过邮箱查找用户
        const user = await userDatabase.getUserByEmail(value.email)

        if (!user) {
          throw new Error('邮箱或密码错误')
        }

        // 验证密码
        const isPasswordValid = await verifyPassword(value.password, user.password)

        if (!isPasswordValid) {
          throw new Error('邮箱或密码错误')
        }

        // 登录成功，保存用户信息到状态管理
        login({
          id: user.id,
          email: user.email,
          username: user.username || `${user.first_name || ''}${user.last_name || ''}`.trim() || user.email.split('@')[0],
          fullName: user.full_name || `${user.first_name || ''}${user.last_name || ''}`.trim(),
          avatarUrl: user.avatar_url,
          birthDate: user.birth_date,
          gender: user.gender,
          bio: user.bio
        })

        onSuccess?.()
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登录失败'
        setError(errorMessage)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">用户登录</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <div>
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? '邮箱是必填项'
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  ? '请输入有效的邮箱地址'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="请输入邮箱地址"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? '密码是必填项'
                  : value.length < 6
                  ? '密码至少需要6个字符'
                  : undefined,
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  placeholder="请输入密码"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>

            {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </div>
      </form>

      {onSwitchToRegister && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            还没有账户？{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              立即注册
            </button>
          </p>
        </div>
      )}
    </div>
  )
}