import { useAuth } from '../hooks/useAuth.tsx'

export function Dashboard() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <p className="text-gray-600">用户信息加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="用户头像"
                  className="w-16 h-16 rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
                <p className="text-white/80">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">用户信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">基本信息</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">用户名:</span>
                    <p className="font-medium text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">邮箱:</span>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                  {user.fullName && (
                    <div>
                      <span className="text-sm text-gray-500">姓名:</span>
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">详细信息</h3>
                <div className="space-y-2">
                  {user.birthDate && (
                    <div>
                      <span className="text-sm text-gray-500">生日:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(user.birthDate).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  )}
                  {user.gender && (
                    <div>
                      <span className="text-sm text-gray-500">性别:</span>
                      <p className="font-medium text-gray-900">
                        {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
                      </p>
                    </div>
                  )}
                  {user.bio && (
                    <div>
                      <span className="text-sm text-gray-500">个人简介:</span>
                      <p className="font-medium text-gray-900">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">个人资料</h3>
              <p className="text-sm text-gray-600">查看和编辑您的个人信息</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">账户状态</h3>
              <p className="text-sm text-gray-600">您的账户运行良好</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">设置</h3>
              <p className="text-sm text-gray-600">管理您的账户设置</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800">欢迎来到用户仪表板</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  这是您的个人仪表板，您可以在这里查看和管理您的账户信息。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}