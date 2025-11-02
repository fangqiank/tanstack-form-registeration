import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { userDatabase, updateUserAvatar } from '../utils/database'

// 表单数据接口
interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone: string
  birthDate: string
  gender: 'male' | 'female' | 'other' | ''
  bio: string
  newsletter: boolean
  notifications: boolean
  privacyPublic: boolean
  marketingEmails: boolean
  avatar: File | null
  terms: boolean
}

// 验证辅助函数
const validateEmail = (email: string): boolean => {
  // 宽松的邮箱验证，只要格式正确即可用于测试
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length >= 5 && email.length <= 254
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''))
}

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密码至少需要8个字符')
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符 (@$!%*?&)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

const validateName = (name: string): boolean => {
  const nameRegex = /^[\p{L}\s\-']+$/u
  return nameRegex.test(name.trim())
}

const validateAge = (birthDate: string): { isValid: boolean; error?: string } => {
  if (!birthDate) return { isValid: true }

  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
    ? age - 1
    : age

  if (actualAge < 13) {
    return { isValid: false, error: '您必须年满13岁才能注册' }
  }

  if (actualAge > 120) {
    return { isValid: false, error: '请输入有效的出生日期' }
  }

  return { isValid: true }
}

// 异步验证函数
const checkEmailUniqueness = async (email: string): Promise<string | undefined> => {
  try {
    // 使用 Supabase 数据库检查邮箱是否已存在
    const emailExists = await userDatabase.checkEmailExists(email)

    if (emailExists) {
      return '该邮箱已被注册'
    }

    return undefined
  } catch (error) {
    // 优雅处理406错误（RLS权限问题）和其他网络错误
    const errorMessage = error instanceof Error ? error.message : String(error)

    // 如果是406错误或其他权限错误，静默处理
    if (errorMessage.includes('406') || errorMessage.includes('Not Acceptable') ||
        errorMessage.includes('permission') || errorMessage.includes('authorization')) {
      console.log('邮箱验证暂时不可用，将允许继续注册:', email)
      return undefined
    }

    // 对于其他错误，记录但不阻止用户
    console.log('邮箱唯一性检查遇到问题，允许继续注册:', errorMessage)
    return undefined
  }
}

const validateAvatar = (file: File | null): string | undefined => {
  if (!file) return undefined

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return '只支持 JPG、PNG、GIF、WebP 格式的图片'
  }

  // 检查文件大小 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return '图片大小不能超过 5MB'
  }

  return undefined
}

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      gender: '',
      bio: '',
      newsletter: false,
      notifications: false,
      privacyPublic: false,
      marketingEmails: false,
      avatar: null,
      terms: false,
    },
    // 表单级别验证
    validators: {
      onChange: ({ value }: { value: RegisterFormData }) => {
        // 密码确认匹配验证
        if (value.password && value.confirmPassword && value.password !== value.confirmPassword) {
          return {
            fields: {
              confirmPassword: '密码不匹配'
            }
          }
        }
        return undefined
      },
      onSubmit: ({ value }: { value: RegisterFormData }) => {
        // 提交时的全局验证
        if (value.phone && !validatePhone(value.phone)) {
          return {
            fields: {
              phone: '请输入有效的电话号码'
            }
          }
        }

        if (value.firstName && !validateName(value.firstName)) {
          return {
            fields: {
              firstName: '名字只包含字母、空格、连字符和撇号'
            }
          }
        }

        if (value.lastName && !validateName(value.lastName)) {
          return {
            fields: {
              lastName: '姓氏只包含字母、空格、连字符和撇号'
            }
          }
        }

        if (value.birthDate) {
          const ageValidation = validateAge(value.birthDate)
          if (!ageValidation.isValid) {
            return {
              fields: {
                birthDate: ageValidation.error
              }
            }
          }
        }

        return undefined
      },
      onSubmitAsync: async ({ value }: { value: RegisterFormData }) => {
        // 异步提交验证 - 检查邮箱唯一性
        if (validateEmail(value.email)) {
          const emailError = await checkEmailUniqueness(value.email)
          if (emailError) {
            return {
              fields: {
                email: emailError
              }
            }
          }
        }

        return null
      }
    },
    onSubmit: async ({ value }: { value: RegisterFormData }) => {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      try {
        // 额外的密码强度验证
        const passwordValidation = validatePassword(value.password)
        if (!passwordValidation.isValid) {
          setError(passwordValidation.errors.join(', '))
          return
        }

        // 头像验证
        const avatarError = validateAvatar(value.avatar)
        if (avatarError) {
          setError(avatarError)
          return
        }

        console.log('注册表单数据:', {
          email: value.email,
          firstName: value.firstName,
          lastName: value.lastName,
          phone: value.phone
        })

  
        // Supabase 数据库模式 - 直接插入数据库
        console.log('使用 Supabase 数据库保存数据')

        // 创建用户记录（包含密码）
        const userData = {
          email: value.email,
          password: value.password, // 现在包含密码
          firstName: value.firstName,
          lastName: value.lastName,
          phone: value.phone,
          birthDate: value.birthDate,
          gender: value.gender,
          bio: value.bio
        }

        let newUser = await userDatabase.createUser(userData)

        // 如果有头像，将文件转换为base64并存储（简化处理）
        let avatarUrl = null
        if (value.avatar) {
          console.log('处理头像文件：', value.avatar.name)
          try {
            // 将文件转换为base64字符串
            const reader = new FileReader()
            avatarUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string
                resolve(result)
              }
              reader.onerror = reject
              reader.readAsDataURL(value.avatar!)
            })
            console.log('头像已转换为base64格式，长度:', avatarUrl.length)
          } catch (error) {
            console.error('头像处理失败:', error)
            // 即使头像处理失败，也继续注册流程
          }
        }

        // 如果有头像，更新用户记录中的avatar_url字段
        if (avatarUrl) {
          try {
            await userDatabase.updateUserAvatar(newUser.id, avatarUrl)
            console.log('头像URL已更新到数据库')
            // 更新本地用户数据，包含头像URL
            newUser.avatar_url = avatarUrl
          } catch (error) {
            console.error('更新头像URL失败:', error)
            // 即使头像更新失败，也继续注册流程
          }
        }

        // 创建用户偏好设置
        await userDatabase.createUserPreferences({
          userId: newUser.id,
          newsletter: value.newsletter,
          notifications: value.notifications,
          privacyPublic: value.privacyPublic,
          marketingEmails: value.marketingEmails
        })

        setSuccess(`注册成功！
邮箱：${value.email}
姓名：${value.firstName} ${value.lastName}
电话：${value.phone || '未提供'}
出生日期：${value.birthDate || '未提供'}
性别：${value.gender || '未提供'}
${value.bio ? '个人简介：已填写' : '个人简介：未填写'}
${value.avatar ? '头像：已上传' : '头像：未上传'}
${value.newsletter ? '新闻通讯：已订阅' : '新闻通讯：未订阅'}
${value.notifications ? '通知：已开启' : '通知：未开启'}
${value.privacyPublic ? '资料：公开' : '资料：私有'}
${value.marketingEmails ? '营销邮件：已订阅' : '营销邮件：未订阅'}

用户ID：${newUser.id}
创建时间：${newUser.created_at}

数据已成功保存到 Supabase 数据库！`)
        form.reset()
        setIsLoading(false)

        // 如果有成功回调，调用它
        if (onSuccess) {
          onSuccess()
        }
        return
      } catch (error) {
        console.error('注册过程中发生错误:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setError(`注册失败: ${errorMessage}`)
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-violet-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            创建您的账户
          </h2>
          <p className="text-gray-300">
            填写以下信息完成注册
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-sm py-10 px-8 shadow-2xl rounded-2xl border border-gray-700/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              注册
            </h2>
            <p className="text-gray-400 text-center text-sm">
              创建您的新账户
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm animate-pulse">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">注册失败</span>
              </div>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900 border border-green-600 text-green-200 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">注册成功</span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-line">{success}</p>
            </div>
          )}

          
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-8"
          >
                {/* 邮箱 */}
                <div className="relative">
                  <form.Field
                    name="email"
                    asyncDebounceMs={1000} // 1秒防抖
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return '邮箱是必填项'
                        if (!validateEmail(value)) return '邮箱格式不正确'
                        return undefined
                      },
                      onChangeAsync: async ({ value }) => {
                        // 只有在邮箱格式正确时才检查唯一性
                        if (value && validateEmail(value)) {
                          return await checkEmailUniqueness(value)
                        }
                        return undefined
                      }
                    }}
                  >
                    {(field) => (
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className={`block w-full px-4 py-4 text-base bg-gray-900/50 border rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-transparent backdrop-blur-sm ${
                            field.state.meta.errors.length > 0
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                              : field.state.meta.isValid
                              ? 'border-green-500 focus:ring-green-500 focus:border-green-500 hover:border-green-400'
                              : 'border-gray-600 hover:border-gray-500 focus:bg-gray-900/70'
                          }`}
                          placeholder="邮箱地址 *"
                        />
                        <label
                          htmlFor="email"
                          className={`absolute left-4 transition-all duration-300 ease-out pointer-events-none ${
                            field.state.value || field.state.meta.isTouched
                              ? 'top-0 -translate-y-3 text-xs text-blue-400 bg-gray-800 px-2 rounded'
                              : 'top-4 text-base text-gray-400'
                          }`}
                        >
                          邮箱地址 *
                        </label>
                        {field.state.meta.isValidating && (
                          <div className="absolute right-4 top-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                        {field.state.meta.isValid && !field.state.meta.isValidating && (
                          <div className="absolute right-4 top-4">
                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}

                        {/* 显示错误 - 只显示一次 */}
                        {field.state.meta.errors.length > 0 && (
                          <div className="mt-2">
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-200">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* 密码 */}
                <div className="relative">
                  <form.Field
                    name="password"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return '密码是必填项'
                        const validation = validatePassword(value)
                        return validation.isValid ? undefined : validation.errors.join(', ')
                      }
                    }}
                  >
                    {(field) => {
                      const passwordValidation = validatePassword(field.state.value)
                      const strength = field.state.value ?
                        (passwordValidation.isValid ? 'strong' :
                         passwordValidation.errors.length <= 2 ? 'medium' : 'weak') : 'none'

                      return (
                        <div className="relative">
                          <input
                            id="password"
                            type="password"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            className={`block w-full px-4 py-4 text-base bg-gray-900/50 border rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-transparent backdrop-blur-sm ${
                              field.state.meta.errors.length > 0
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                                : 'border-gray-600 hover:border-gray-500 focus:bg-gray-900/70'
                            }`}
                            placeholder="密码 *"
                          />
                          <label
                            htmlFor="password"
                            className={`absolute left-4 transition-all duration-300 ease-out pointer-events-none ${
                              field.state.value || field.state.meta.isTouched
                                ? 'top-0 -translate-y-3 text-xs text-blue-400 bg-gray-800 px-2 rounded'
                                : 'top-4 text-base text-gray-400'
                            }`}
                          >
                            密码 *
                          </label>
                          {field.state.value && (
                            <div className="absolute right-4 top-4">
                              {strength === 'strong' && (
                                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {strength === 'medium' && (
                                <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                              {strength === 'weak' && (
                                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }}
                  </form.Field>
                </div>

                {/* 确认密码 */}
                <div className="mb-4">
                  <form.Field
                    name="confirmPassword"
                    validators={{
                      onChange: ({ value }) =>
                        !value ? '请确认密码' : undefined,
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                          确认密码 *
                        </label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white placeholder-gray-400"
                          placeholder="•••••••"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="mt-1 text-sm text-red-200">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* 姓名 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <form.Field
                    name="firstName"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value.trim()) return '名字是必填项'
                        if (value.trim().length > 50) return '名字不能超过50个字符'
                        if (!validateName(value)) return '名字只包含字母、空格、连字符和撇号'
                        return undefined
                      },
                      onBlur: () => {
                        return undefined
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-200">
                          名字 *
                        </label>
                        <div className="relative">
                          <input
                            id="firstName"
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            className={`mt-2 block w-full px-4 py-3 border rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700/70 text-white placeholder-gray-400 backdrop-blur-sm hover:bg-gray-700/90 ${
                              field.state.meta.errors.length > 0
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                                : field.state.meta.isValid && field.state.value
                                ? 'border-green-500 focus:ring-green-500 focus:border-green-500 hover:border-green-400'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            placeholder="张"
                          />
                          {field.state.meta.isValid && field.state.value && !field.state.meta.errors.length && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* 字符计数 */}
                        {field.state.value && (
                          <div className="mt-1 flex justify-between">
                            <div className="text-xs text-gray-400">
                              已输入 {field.state.value.trim().length} 个字符
                            </div>
                            {field.state.meta.errors.length > 0 && (
                              <div className="text-xs text-red-200">
                                {field.state.meta.errors[0]}
                              </div>
                            )}
                          </div>
                        )}

                        {field.state.meta.errors.length > 0 && (
                          <div className="mt-1">
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-200">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Field>

                  <form.Field
                    name="lastName"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value.trim()) return '姓氏是必填项'
                        if (value.trim().length > 50) return '姓氏不能超过50个字符'
                        if (!validateName(value)) return '姓氏只包含字母、空格、连字符和撇号'
                        return undefined
                      },
                      onBlur: () => {
                        return undefined
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-200">
                          姓氏 *
                        </label>
                        <div className="relative">
                          <input
                            id="lastName"
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            className={`mt-2 block w-full px-4 py-3 border rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700/70 text-white placeholder-gray-400 backdrop-blur-sm hover:bg-gray-700/90 ${
                              field.state.meta.errors.length > 0
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                                : field.state.meta.isValid && field.state.value
                                ? 'border-green-500 focus:ring-green-500 focus:border-green-500 hover:border-green-400'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            placeholder="三"
                          />
                          {field.state.meta.isValid && field.state.value && !field.state.meta.errors.length && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* 字符计数 */}
                        {field.state.value && (
                          <div className="mt-1 flex justify-between">
                            <div className="text-xs text-gray-400">
                              已输入 {field.state.value.trim().length} 个字符
                            </div>
                            {field.state.meta.errors.length > 0 && (
                              <div className="text-xs text-red-200">
                                {field.state.meta.errors[0]}
                              </div>
                            )}
                          </div>
                        )}

                        {field.state.meta.errors.length > 0 && (
                          <div className="mt-1">
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-200">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* 电话 */}
                <div className="mb-4">
                  <form.Field
                    name="phone"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return undefined // 电话号码是可选的
                        const cleanedPhone = value.replace(/[\s\-()]/g, '')
                        if (cleanedPhone.length > 0 && cleanedPhone.length < 7) {
                          return '电话号码至少需要7位数字'
                        }
                        if (cleanedPhone.length > 16) {
                          return '电话号码过长'
                        }
                        if (cleanedPhone.length > 0 && !validatePhone(value)) {
                          return '请输入有效的电话号码格式'
                        }
                        return undefined
                      },
                      onBlur: ({ value }) => {
                        if (value && value.trim().length > 0 && !validatePhone(value)) {
                          return '请输入有效的电话号码格式（例如：+86 138 0013 8000）'
                        }
                        return undefined
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-200">
                          电话号码
                          <span className="ml-1 text-xs text-gray-400">(可选)</span>
                        </label>
                        <div className="relative">
                          <input
                            id="phone"
                            type="tel"
                            value={field.state.value}
                            onChange={(e) => {
                              // 自动格式化电话号码
                              let formattedValue = e.target.value
                              // 移除所有非数字字符，除了 +
                              const cleaned = formattedValue.replace(/[^\d+]/g, '')

                              if (cleaned.startsWith('+86') && cleaned.length > 3) {
                                // 中国号码格式化: +86 138 0013 8000
                                const mobile = cleaned.substring(3)
                                if (mobile.length <= 3) {
                                  formattedValue = `+86 ${mobile}`
                                } else if (mobile.length <= 7) {
                                  formattedValue = `+86 ${mobile.substring(0, 3)} ${mobile.substring(3)}`
                                } else {
                                  formattedValue = `+86 ${mobile.substring(0, 3)} ${mobile.substring(3, 7)} ${mobile.substring(7, 11)}`
                                }
                              } else if (cleaned.length > 0) {
                                formattedValue = cleaned
                              }

                              field.handleChange(formattedValue)
                            }}
                            onBlur={field.handleBlur}
                            className={`mt-2 block w-full px-4 py-3 border rounded-xl shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700/70 text-white placeholder-gray-400 backdrop-blur-sm hover:bg-gray-700/90 ${
                              field.state.meta.errors.length > 0
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 hover:border-red-400'
                                : field.state.meta.isValid && field.state.value
                                ? 'border-green-500 focus:ring-green-500 focus:border-green-500 hover:border-green-400'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                            placeholder="+86 138 0013 8000"
                          />
                          {field.state.meta.isValid && field.state.value && !field.state.meta.errors.length && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* 电话号码格式提示 */}
                        {field.state.value && (
                          <div className="mt-1 text-xs text-gray-400">
                            支持格式：+86 138 0013 8000 或 +1 555 123 4567
                          </div>
                        )}

                        {/* 错误显示 */}
                        {field.state.meta.errors.length > 0 && (
                          <div className="mt-1">
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-200">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>
  
                {/* 出生日期 */}
                <div className="mb-4">
                  <form.Field name="birthDate">
                    {(field) => (
                      <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-200">
                          出生日期
                        </label>
                        <input
                          id="birthDate"
                          type="date"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="mt-1 block w-full max-w-sm px-3 py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* 性别 */}
                <div className="mb-4">
                  <form.Field name="gender">
                    {(field) => (
                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-200">
                          性别
                        </label>
                        <select
                          id="gender"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value as 'male' | 'female' | 'other' | '')}
                          className="mt-1 block w-full max-w-sm px-3 py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                        >
                          <option value="">请选择</option>
                          <option value="male">男性</option>
                          <option value="female">女性</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* 头像上传 */}
                <div className="mb-4">
                  <form.Field
                    name="avatar"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return undefined
                        return validateAvatar(value)
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="avatar" className="block text-sm font-medium text-gray-200">
                          头像
                          <span className="ml-1 text-xs text-gray-400">(可选)</span>
                        </label>
                        <div className="mt-1 flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {field.state.value ? (
                              <div className="relative">
                                <img
                                  className="h-16 w-16 rounded-full object-cover"
                                  src={URL.createObjectURL(field.state.value)}
                                  alt="头像预览"
                                />
                                <button
                                  type="button"
                                  onClick={() => field.handleChange(null)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center">
                                <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              id="avatar"
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => field.handleChange(e.target.files?.[0] || null)}
                              className={`block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                field.state.meta.errors.length > 0
                                  ? 'file:bg-red-900 file:text-red-200 focus:ring-red-500'
                                  : 'file:bg-blue-900 file:text-blue-200 hover:file:bg-blue-800'
                              }`}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                              支持 JPG、PNG、GIF、WebP 格式，最大 5MB
                            </p>
                          </div>
                        </div>

                        {/* 文件信息显示 */}
                        {field.state.value && (
                          <div className="mt-2 p-2 bg-gray-900 rounded-md">
                            <div className="flex justify-between items-start">
                              <div className="text-sm">
                                <p className="font-medium text-white">{field.state.value.name}</p>
                                <p className="text-gray-400">
                                  {(field.state.value.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <p className="text-gray-400">
                                  {field.state.value.type}
                                </p>
                              </div>
                              {field.state.meta.isValid && (
                                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 错误显示 */}
                        {field.state.meta.errors.length > 0 && (
                          <div className="mt-1">
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-200">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* 个人简介 */}
                <div className="mb-4">
                  <form.Field
                    name="bio"
                    validators={{
                      onChange: ({ value }) => {
                        if (value && value.length > 500) {
                          return '个人简介不能超过500个字符'
                        }
                        return undefined
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-200">
                          个人简介
                          <span className="ml-1 text-xs text-gray-400">(可选)</span>
                        </label>
                        <div className="relative">
                          <textarea
                            id="bio"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            rows={4}
                            className={`mt-1 block w-full max-w-sm px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none bg-gray-700 text-white placeholder-gray-400 ${
                              field.state.meta.errors.length > 0
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-600'
                            }`}
                            placeholder="介绍一下自己..."
                            maxLength={500}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            {field.state.value.length}/500
                          </div>
                        </div>

                        {/* 字符计数提示 */}
                        <div className="mt-1 flex justify-between items-center">
                          <div className="text-xs text-gray-400">
                            还可以输入 {500 - field.state.value.length} 个字符
                          </div>
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-xs text-red-200">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>

                        {/* 进度条 */}
                        {field.state.value && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-200 ${
                                  field.state.value.length > 450
                                    ? 'bg-red-500'
                                    : field.state.value.length > 400
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min((field.state.value.length / 500) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 错误显示 */}
                        {field.state.meta.errors.length > 0 && (
                          <div className="mt-1">
                            {field.state.meta.errors.map((error, index) => (
                              <p key={index} className="text-sm text-red-200">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

              {/* 偏好设置 */}
              <div className="space-y-4">
              <form.Field name="newsletter">
                {(field) => (
                  <div className="flex items-center group">
                    <input
                      id="newsletter"
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-5 w-5 text-blue-600 bg-gray-900/50 border-2 border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:border-blue-400 checked:bg-blue-600 checked:border-blue-600"
                    />
                    <label htmlFor="newsletter" className="ml-3 block text-sm text-gray-200 group-hover:text-white transition-colors duration-200 cursor-pointer">
                      订阅新闻通讯
                    </label>
                  </div>
                )}
              </form.Field>

              <form.Field name="notifications">
                {(field) => (
                  <div className="flex items-center group">
                    <input
                      id="notifications"
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-5 w-5 text-blue-600 bg-gray-900/50 border-2 border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:border-blue-400 checked:bg-blue-600 checked:border-blue-600"
                    />
                    <label htmlFor="notifications" className="ml-3 block text-sm text-gray-200 group-hover:text-white transition-colors duration-200 cursor-pointer">
                      接收通知
                    </label>
                  </div>
                )}
              </form.Field>

              <form.Field name="privacyPublic">
                {(field) => (
                  <div className="flex items-center group">
                    <input
                      id="privacyPublic"
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-5 w-5 text-blue-600 bg-gray-900/50 border-2 border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:border-blue-400 checked:bg-blue-600 checked:border-blue-600"
                    />
                    <label htmlFor="privacyPublic" className="ml-3 block text-sm text-gray-200 group-hover:text-white transition-colors duration-200 cursor-pointer">
                      公开个人资料
                    </label>
                  </div>
                )}
              </form.Field>

              <form.Field name="marketingEmails">
                {(field) => (
                  <div className="flex items-center group">
                    <input
                      id="marketingEmails"
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-5 w-5 text-blue-600 bg-gray-900/50 border-2 border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:border-blue-400 checked:bg-blue-600 checked:border-blue-600"
                    />
                    <label htmlFor="marketingEmails" className="ml-3 block text-sm text-gray-200 group-hover:text-white transition-colors duration-200 cursor-pointer">
                      接收营销邮件
                    </label>
                  </div>
                )}
              </form.Field>
            </div>

            {/* 条款和条件 - 特殊样式 */}
            <div className="mt-8 p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
              <form.Field
                name="terms"
                validators={{
                  onChange: ({ value }) => !value ? '您必须同意条款和条件' : undefined,
                }}
              >
                {(field) => (
                  <div>
                    <div className="flex items-start">
                      <div className="flex items-center h-6">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={field.state.value}
                          onChange={(e) => field.handleChange(e.target.checked)}
                          className="h-5 w-5 text-red-600 bg-gray-900/50 border-2 border-red-600 rounded focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 hover:border-red-400 checked:bg-red-600 checked:border-red-600"
                        />
                      </div>
                      <label htmlFor="terms" className="ml-3 block text-sm leading-6 cursor-pointer">
                        <span className="text-gray-200">
                          我同意
                        </span>{' '}
                        <a href="#" className="text-red-400 hover:text-red-300 underline font-medium transition-colors">
                          服务条款
                        </a>{' '}
                        <span className="text-gray-200">和</span>{' '}
                        <a href="#" className="text-red-400 hover:text-red-300 underline font-medium transition-colors">
                          隐私政策
                        </a>
                        <span className="text-red-400 font-bold ml-1">*</span>
                      </label>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <div className="mt-3 ml-8 p-2 bg-red-900/50 border border-red-600/50 rounded">
                        <p className="text-sm text-red-200 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {field.state.meta.errors[0]}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </form.Field>
              <div className="mt-2 text-xs text-gray-400">
                <p>• 必须同意服务条款和隐私政策才能完成注册</p>
                <p>• 点击链接可查看完整的条款内容</p>
              </div>
            </div>

            {/* 表单级别错误显示 */}
            <form.Subscribe
              selector={(state) => state.errorMap}
              children={(errorMap) => (
                <div>
                  {errorMap.onChange && (
                    <div className="mb-4 bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded">
                      {String(errorMap.onChange)}
                    </div>
                  )}
                  {errorMap.onSubmit && (
                    <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
                      {String(errorMap.onSubmit)}
                    </div>
                  )}
                  {errorMap.onSubmit && (
                    <div className="mb-4 bg-orange-900 border border-orange-700 text-orange-200 px-4 py-3 rounded">
                      {String(errorMap.onSubmit)}
                    </div>
                  )}
                </div>
              )}
            />

            {/* 表单状态指示器 */}
            <form.Subscribe
              selector={(state) => ({
                isDirty: state.isDirty,
                isValid: state.isValid,
                isSubmitting: state.isSubmitting,
                canSubmit: state.canSubmit,
                fieldErrors: Object.entries(state.fieldMeta).filter(
                  ([, meta]) => meta.errors.length > 0
                ).map(([key]) => key)
              })}
              children={({ isDirty, isValid, isSubmitting, canSubmit, fieldErrors }) => (
                <div className="mb-4 p-4 bg-gray-900 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">表单状态</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        isDirty ? 'bg-blue-500' : 'bg-gray-600'
                      }`}></div>
                      <span className="text-gray-300">
                        {isDirty ? '已修改' : '未修改'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        isValid ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-300">
                        {isValid ? '验证通过' : '验证失败'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        canSubmit ? 'bg-green-500' : 'bg-gray-600'
                      }`}></div>
                      <span className="text-gray-300">
                        {canSubmit ? '可提交' : '不可提交'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        isSubmitting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'
                      }`}></div>
                      <span className="text-gray-300">
                        {isSubmitting ? '提交中' : '空闲'}
                      </span>
                    </div>
                  </div>

                  {/* 字段错误统计 */}
                  {fieldErrors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-sm text-red-200">
                        发现 {fieldErrors.length} 个字段需要修正：
                      </p>
                      <ul className="mt-1 text-xs text-red-200">
                        {fieldErrors.map((fieldName) => (
                          <li key={fieldName} className="ml-4 list-disc">
                            {fieldName === 'email' && '邮箱地址'}
                            {fieldName === 'password' && '密码'}
                            {fieldName === 'confirmPassword' && '确认密码'}
                            {fieldName === 'firstName' && '名字'}
                            {fieldName === 'lastName' && '姓氏'}
                            {fieldName === 'phone' && '电话号码'}
                            {fieldName === 'birthDate' && '出生日期'}
                            {fieldName === 'avatar' && '头像'}
                            {fieldName === 'bio' && '个人简介'}
                            {fieldName === 'terms' && '条款和条件'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            />

            {/* 提交按钮 */}
            <div>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                children={([canSubmit, isSubmitting]) => (
                  <button
                    type="submit"
                    disabled={!canSubmit || isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading || isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isSubmitting ? '正在提交...' : '正在注册...'}
                      </span>
                    ) : (
                      '创建账户'
                    )}
                  </button>
                )}
              />
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">已有账户？</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              {onSwitchToLogin ? (
                <button
                  onClick={onSwitchToLogin}
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  立即登录
                </button>
              ) : (
                <a
                  href="#"
                  className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  立即登录
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}