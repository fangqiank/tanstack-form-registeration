// 注册表单组件测试
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../../components/RegisterForm'
import { FormProvider } from '@tanstack/react-form'
import { validateEmail, validatePassword } from '../__mocks__/utils'

// Mock所有工具函数
jest.mock('../../utils/database')
jest.mock('../../utils/supabase-database')

describe('RegisterForm组件', () => {
  const defaultProps = {
    onSuccess: jest.fn(),
    onSwitchToLogin: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基本渲染', () => {
    it('应该渲染注册表单', () => {
      render(<RegisterForm {...defaultProps} />)

      expect(screen.getByText(/创建账户/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/密码/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/名字/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/姓氏/i)).toBeInTheDocument()
    })

    it('应该显示切换到登录的链接', () => {
      render(<RegisterForm {...defaultProps} />)

      const loginLink = screen.getByText(/已有账户\? 点击登录/i)
      expect(loginLink).toBeInTheDocument()
    })

    it('应该显示条款和条件复选框', () => {
      render(<RegisterForm {...defaultProps} />)

      expect(screen.getByText(/我同意服务条款和隐私政策/i)).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: 'terms' })).toBeInTheDocument()
    })
  })

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      render(<RegisterForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /submit/i })

      // 尝试提交空表单
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/邮箱是必填项/i)).toBeInTheDocument()
        expect(screen.getByText(/密码是必填项/i)).toBeInTheDocument()
        expect(screen.getByText(/名字是必填项/i)).toBeInTheDocument()
        expect(screen.getByText(/姓氏是必填项/i)).toBeInTheDocument()
        expect(screen.getByText(/您必须同意条款和条件/i)).toBeInTheDocument()
      })
    })

    it('应该验证邮箱格式', async () => {
      render(<RegisterForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/邮箱地址/i)

      // 输入无效邮箱
      await userEvent.type(emailInput, 'invalid-email')

      await waitFor(() => {
        expect(screen.getByText(/邮箱格式不正确/i)).toBeInTheDocument()
      })

      // 输入有效邮箱
      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'test@example.com')

      await waitFor(() => {
        expect(screen.queryByText(/邮箱格式不正确/i)).not.toBeInTheDocument()
      })
    })

    it('应该验证密码强度', async () => {
      render(<RegisterForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密码/i)

      // 输入弱密码
      await userEvent.type(passwordInput, 'weak')

      await waitFor(() => {
        expect(screen.getByText(/密码至少需要8个字符/i)).toBeInTheDocument()
        expect(screen.getByText(/密码必须包含至少一个大写字母/i)).toBeInTheDocument()
        expect(screen.getByText(/密码必须包含至少一个小写字母/i)).toBeInTheDocument()
        expect(screen.getByText(/密码必须包含至少一个数字/i)).toBeInTheDocument()
        expect(screen.getByText(/密码必须包含至少一个特殊字符/i)).toBeInTheDocument()
      })

      // 输入强密码
      await userEvent.clear(passwordInput)
      await userEvent.type(passwordInput, 'StrongP@ssw0rd123')

      await waitFor(() => {
        expect(screen.queryByText(/密码至少需要8个字符/i)).not.toBeInTheDocument()
      })
    })

    it('应该验证密码确认', async () => {
      render(<RegisterForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密码/i)
      const confirmPasswordInput = screen.getByLabelText(/确认密码/i)

      // 输入不同的密码
      await userEvent.type(passwordInput, 'Password123!')
      await userEvent.type(confirmPasswordInput, 'Different123!')

      await waitFor(() => {
        expect(screen.getByText(/请确认密码/i)).toBeInTheDocument()
      })

      // 输入相同的密码
      await userEvent.clear(confirmPasswordInput)
      await userEvent.type(confirmPasswordInput, 'Password123!')

      await waitFor(() => {
        expect(screen.queryByText(/请确认密码/i)).not.toBeInTheDocument()
      })
    })

    it('应该验证电话号码格式', async () => {
      render(<RegisterForm {...defaultProps} />)

      const phoneInput = screen.getByLabelText(/电话/i)

      // 输入无效电话号码
      await userEvent.type(phoneInput, 'invalid-phone')

      await waitFor(() => {
        expect(screen.getByText(/请输入有效的电话号码格式/i)).toBeInTheDocument()
      })

      // 输入有效电话号码
      await userEvent.clear(phoneInput)
      await userEvent.type(phoneInput, '+86 13800138000')

      await waitFor(() => {
        expect(screen.queryByText(/请输入有效的电话号码格式/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('头像上传', () => {
    it('应该能够选择头像文件', async () => {
      render(<RegisterForm {...defaultProps} />)

      const fileInput = screen.getByLabelText(/头像/i)
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      await userEvent.upload(fileInput, file)

      // 应该显示文件名
      expect(screen.getByText(/test\.png/)).toBeInTheDocument()
    })

    it('应该验证头像文件类型', async () => {
      render(<RegisterForm {...defaultProps} />)

      const fileInput = screen.getByLabelText(/头像/i)
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })

      await userEvent.upload(fileInput, invalidFile)

      await waitFor(() => {
        expect(screen.getByText(/头像只支持 JPG、PNG、GIF、WebP 格式/i)).toBeInTheDocument()
      })
    })

    it('应该验证头像文件大小', async () => {
      render(<RegisterForm {...defaultProps} />)

      const fileInput = screen.getByLabelText(/头像/i)

      // 创建一个6MB的大文件
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })

      await userEvent.upload(fileInput, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/头像文件大小不能超过5MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('表单提交', () => {
    const validFormData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: '测试',
      lastName: '用户',
      phone: '+86 13800138000',
      terms: true
    }

    it('应该能够成功提交表单', async () => {
      render(<RegisterForm {...defaultProps} />)

      // 填写所有字段
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), validFormData.email)
      await userEvent.type(screen.getByLabelText(/密码/i), validFormData.password)
      await userEvent.type(screen.getByLabelText(/确认密码/i), validFormData.confirmPassword)
      await userEvent.type(screen.getByLabelText(/名字/i), validFormData.firstName)
      await userEvent.type(screen.getByLabelText(/姓氏/i), validFormData.lastName)
      await userEvent.type(screen.getByLabelText(/电话/i), validFormData.phone)
      await userEvent.click(screen.getByRole('checkbox', { name: 'terms' }))

      const submitButton = screen.getByRole('button', { name: /submit/i })

      // Mock成功的注册响应
      const mockCreateUser = require('../../utils/database').userDatabase.createUser
      mockCreateUser.mockResolvedValue({
        id: 'new-user-id',
        email: validFormData.email,
        first_name: validFormData.firstName,
        last_name: validFormData.lastName
      })

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith()
      })
    })

    it('应该在注册成功后显示成功信息', async () => {
      render(<RegisterForm {...defaultProps} />)

      // 填写表单
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), validFormData.email)
      await userEvent.type(screen.getByLabelText(/密码/i), validFormData.password)
      await userEvent.type(screen.getByLabelText(/确认密码/i), validFormData.confirmPassword)
      await userEvent.type(screen.getByLabelText(/名字/i), validFormData.firstName)
      await userEvent.type(screen.getByLabelText(/姓氏/i), validFormData.lastName)
      await userEvent.click(screen.getByRole('checkbox', { name: 'terms' }))

      const submitButton = screen.getByRole('button', { name: /submit/i })

      // Mock成功的注册响应
      const mockCreateUser = require('../../utils/database').userDatabase.createUser
      mockCreateUser.mockResolvedValue({
        id: 'new-user-id',
        email: validFormData.email,
        first_name: validFormData.firstName,
        last_name: validFormData.lastName,
        created_at: new Date().toISOString()
      })

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/注册成功/i)).toBeInTheDocument()
        expect(screen.getByText(new RegExp(validFormData.email))).toBeInTheDocument()
      })
    })

    it('应该处理注册失败的情况', async () => {
      render(<RegisterForm {...defaultProps} />)

      // 填写表单
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), 'existing@example.com')
      await userEvent.type(screen.getByLabelText(/密码/i), 'TestPass123!')
      await userEvent.type(screen.getByLabelText(/确认密码/i), 'TestPass123!')
      await userEvent.type(screen.getByLabelText(/名字/i), '测试')
      await userEvent.type(screen.getByLabelText(/姓氏/i), '用户')
      await userEvent.click(screen.getByRole('checkbox', { name: 'terms' }))

      const submitButton = screen.getByRole('button', { name: /submit/i })

      // Mock失败的注册响应
      const mockCreateUser = require('../../utils/database').userDatabase.createUser
      mockCreateUser.mockRejectedValue(new Error('用户已存在'))

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/注册失败/i)).toBeInTheDocument()
      })
    })
  })

  describe('用户交互', () => {
    it('应该能够点击切换到登录页面', async () => {
      render(<RegisterForm {...defaultProps} />)

      const loginLink = screen.getByText(/已有账户\? 点击登录/i)

      await userEvent.click(loginLink)

      expect(defaultProps.onSwitchToLogin).toHaveBeenCalledTimes(1)
    })

    it('应该显示密码强度指示器', async () => {
      render(<RegisterForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密码/i)

      // 输入密码
      await userEvent.type(passwordInput, 'StrongP@ssw0rd')

      // 应该显示强度指示器
      await waitFor(() => {
        expect(screen.getByText(/密码强度:/i)).toBeInTheDocument()
      })
    })

    it('应该显示字符计数器', async () => {
      render(<RegisterForm {...defaultProps} />)

      const bioTextarea = screen.getByLabelText(/个人简介/i)

      await userEvent.type(bioTextarea, 'This is a bio')

      expect(screen.getByText(/还剩下\d+个字符/i)).toBeInTheDocument()
    })
  })

  describe('偏好设置', () => {
    it('应该显示所有偏好设置选项', () => {
      render(<RegisterForm {...defaultProps} />)

      expect(screen.getByLabelText(/订阅新闻通讯/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/接收通知/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/公开个人资料/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/接收营销邮件/i)).toBeInTheDocument()
    })

    it('应该能够切换偏好设置', async () => {
      render(<RegisterForm {...defaultProps} />)

      const newsletterCheckbox = screen.getByLabelText(/订阅新闻通讯/i)
      const notificationsCheckbox = screen.getByLabelText(/接收通知/i)

      expect(newsletterCheckbox).not.toBeChecked()
      expect(notificationsCheckbox).not.toBeChecked()

      await userEvent.click(newsletterCheckbox)
      await userEvent.click(notificationsCheckbox)

      expect(newsletterCheckbox).toBeChecked()
      expect(notificationsCheckbox).toBeChecked()
    })
  })
})