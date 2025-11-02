import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.tsx'
import { RegisterForm } from './components/RegisterForm'
import { LoginForm } from './components/LoginForm'
import { Dashboard } from './components/Dashboard'

type AuthView = 'login' | 'register' | 'dashboard'

function AuthContent() {
  const { isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState<AuthView>(
    isAuthenticated ? 'dashboard' : 'register'
  )

  // 如果用户已认证，始终显示仪表板
  if (isAuthenticated) {
    return <Dashboard />
  }

  // 根据当前视图显示相应组件
  const switchToLogin = () => setCurrentView('login')
  const switchToRegister = () => setCurrentView('register')
  const handleAuthSuccess = () => {
    // 认证成功后，useAuth会自动更新状态，组件会重新渲染
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">React Form Demo</h1>

        {currentView === 'register' && (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}

        {currentView === 'login' && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={switchToRegister}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthContent />
    </AuthProvider>
  )
}

export default App
