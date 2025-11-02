// 登录表单组件测试
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../../components/LoginForm'
import { useAuth } from '../../hooks/useAuth'

// Mock useAuth hook
jest.mock('../../hooks/useAuth')
jest.mock('../../utils/database')
jest.mock('../../utils/supabase-database')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LoginForm组件', () => {
  const defaultProps = {
    onSuccess: jest.fn(),
    onSwitchToRegister: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isAuthenticated: false
    })
  })

  describe('基本渲染', () => {
    it('应该渲染登录表单', () => {
      render(<LoginForm {...defaultProps} />)

      expect(screen.getByText(/用户登录/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/密码/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument()
    })

    it('应该显示切换到注册的链接', () => {
      render(<LoginForm {...defaultProps} />)

      expect(screen.getByText(/没有账户\? 点击注册/i)).toBeInTheDocument()
    })

    it('应该显示"记住我"选项', () => {
      render(<LoginForm {...defaultProps} />)

      expect(screen.getByLabelText(/记住我/i)).toBeInTheDocument()
    })
  })

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      render(<LoginForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /登录/i })

      // 尝试提交空表单
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/邮箱是必填项/i)).toBeInTheDocument()
        expect(screen.getByText(/密码是必填项/i)).toBeInTheDocument()
      })
    })

    it('应该验证邮箱格式', async () => {
      render(<LoginForm {...defaultProps} />)

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

    it('应该验证密码长度', async () => {
      render(<LoginForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密码/i)

      // 输入过短密码
      await userEvent.type(passwordInput, '123')

      await waitFor(() => {
        expect(screen.getByText(/密码至少需要6个字符/i)).toBeInTheDocument()
      })

      // 输入足够长度的密码
      await userEvent.clear(passwordInput)
      await userEvent.type(passwordInput, 'ValidPassword123')

      await waitFor(() => {
        expect(screen.queryByText(/密码至少需要6个字符/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('登录功能', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'TestPassword123'
    }

    it('应该能够成功登录', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn().mockImplementation((userData) => {
          mockUseAuth.mockReturnValue({
            user: userData,
            login: mockUseAuth.mock.results[0].login,
            logout: mockUseAuth.mock.results[0].logout,
            isAuthenticated: true
          })
        }),
        logout: jest.fn(),
        isAuthenticated: false
      })

      render(<LoginForm {...defaultProps} />)

      // 填写登录信息
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), validCredentials.email)
      await userEvent.type(screen.getByLabelText(/密码/i), validCredentials.password)

      const submitButton = screen.getByRole('button', { name: /登录/i })

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(mockUseAuth().login).toHaveBeenCalledWith(
          expect.objectContaining({
            email: validCredentials.email
          })
        )
      })

      expect(defaultProps.onSuccess).toHaveBeenCalled()
    })

    it('应该处理登录失败', async () => {
      render(<LoginForm {...defaultProps} />)

      // 填写错误凭据
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), 'wrong@example.com')
      await userEvent.type(screen.getByLabelText(/密码/i), 'WrongPassword')

      const submitButton = screen.getByRole('button', { name: /登录/i })

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument()
      })
    })

    it('应该显示加载状态', async () => {
      render(<LoginForm {...defaultProps} />)

      // 填写登录信息
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), validCredentials.email)
      await userEvent.type(screen.getByLabelText(/密码/i), validCredentials.password)

      const submitButton = screen.getByRole('button', { name: /登录/i })

      // Mock登录过程中的延迟
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn().mockImplementation(() => {
          return new Promise(resolve => setTimeout(resolve, 1000))
        }),
        logout: jest.fn(),
        isAuthenticated: false
      })

      await userEvent.click(submitButton)

      // 应该显示加载状态
      expect(screen.getByText(/登录中/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('应该显示错误信息', async () => {
      render(<LoginForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /登录/i })

      // Mock登录失败
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn().mockRejectedValue(new Error('登录失败')),
        logout: jest.fn(),
        isAuthenticated: false
      })

      await userEvent.type(screen.getByLabelText(/邮箱地址/i), validCredentials.email)
      await userEvent.type(screen.getByLabelText(/密码/i), validCredentials.password)
      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/登录失败/i)).toBeInTheDocument()
      })
    })
  })

  describe('用户交互', () => {
    it('应该能够点击切换到注册页面', async () => {
      render(<LoginForm {...defaultProps} />)

      const registerLink = screen.getByText(/没有账户\? 点击注册/i)

      await userEvent.click(registerLink)

      expect(defaultProps.onSwitchToRegister).toHaveBeenCalledTimes(1)
    })

    it('应该能够切换"记住我"选项', async () => {
      render(<LoginForm {...defaultProps} />)

      const rememberMeCheckbox = screen.getByLabelText(/记住我/i)

      expect(rememberMeCheckbox).not.toBeChecked()

      await userEvent.click(rememberMe)

      expect(rememberMeCheckbox).toBeChecked()
    })

    it('应该显示密码显示/隐藏切换', () => {
      render(<LoginForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/密码/i)
      const toggleButton = screen.getByRole('button', { name: /切换/i })

      expect(passwordInput.getAttribute('type')).toBe('password')

      // 点击切换按钮
      fireEvent.click(toggleButton)

      expect(passwordInput.getAttribute('type')).toBe('text')
    })

    it('应该显示表单链接', () => {
      render(<LoginForm {...defaultProps} />)

      expect(screen.getByText(/忘记密码\?/i)).toBeInTheDocument()
      expect(screen.getByText(/记住我/i)).toBeInTheDocument()
    })
  })

  describe('表单状态', () => {
    it('应该重置错误状态当用户开始输入时', async () => {
      render(<LoginForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /登录/i })

      // 先提交空表单显示错误
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/邮箱是必填项/i)).toBeInTheDocument()
      })

      // 开始输入邮箱，错误应该消失
      const emailInput = screen.getByLabelText(/邮箱地址/i)
      await userEvent.type(emailInput, 'test@example.com')

      await waitFor(() => {
        expect(screen.queryByText(/邮箱是必填项/i)).not.toBeInTheDocument()
      })
    })

    it('应该在登录成功后重置表单', async () => {
      render(<LoginForm {...defaultProps} />)

      // 填写登录信息
      await userEvent.type(screen.getByLabelText(/邮箱地址/i), validCredentials.email)
      await userEvent.type(screen.getByLabelText(/密码/i), validCredentials.password)

      const submitButton = screen.getByRole('button', { name: /登录/i })

      // Mock成功登录
      mockUseAuth.mockReturnValue({
        user: {
          id: 'test-user-id',
          email: validCredentials.email
        },
        login: jest.fn(),
        logout: jest.fn(),
        isAuthenticated: true
      })

      await userEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue(validCredentials.email)).toBeInTheDocument()
        expect(screen.getByDisplayValue(validCredentials.password)).toBeInTheDocument()
      })
    })
  })

  describe('可访问性', () => {
    it('应该有正确的表单标签关联', () => {
      render(<LoginForm {...defaultProps} />)

      expect(screen.getByLabelText(/邮箱地址/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/密码/i)).toBeInTheDocument()
    })

    it('应该支持键盘导航', async () => {
      render(<LoginForm {...defaultProps} />)

      // Tab键应该按顺序聚焦字段
      await userEvent.tab()
      expect(screen.getByLabelText(/邮箱地址/i)).toHaveFocus()

      await userEvent.tab()
      expect(screen.getByLabelText(/密码/i)).toHaveFocus()

      await userEvent.tab()
      expect(screen.getByRole('button', { name: /登录/i })).toHaveFocus()
    })

    it('应该有适当的ARIA标签', () => {
      render(<LoginForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/邮箱地址/i)
      const passwordInput = screen.getByLabelText(/密码/i)
      const submitButton = screen.getByRole('button', { name: /登录/i })

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })
})