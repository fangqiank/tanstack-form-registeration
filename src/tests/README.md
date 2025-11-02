# 测试文档

## 测试结构

```
src/tests/
├── README.md                    # 测试说明文档
├── __mocks__/                   # Mock文件
│   ├── supabase.ts            # Supabase客户端Mock
│   └── utils.ts               # 工具函数Mock
├── utils/                      # 工具函数测试
│   ├── password.test.ts       # 密码加密工具测试
│   ├── database.test.ts       # 数据库操作测试
│   └── validation.test.ts     # 验证函数测试
├── components/                 # 组件测试
│   ├── RegisterForm.test.ts   # 注册表单测试
│   ├── LoginForm.test.ts      # 登录表单测试
│   └── Dashboard.test.ts      # 用户仪表板测试
└── setup.ts                    # 测试环境配置
```

## 测试命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test RegisterForm.test.ts

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监听模式运行测试
npm test -- --watch
```

## 测试覆盖率目标

- **总体覆盖率**: ≥ 80%
- **函数覆盖率**: ≥ 90%
- **分支覆盖率**: ≥ 75%
- **语句覆盖率**: ≥ 85%

## 测试类型

### 1. 单元测试 (Unit Tests)
- 测试独立的函数和组件
- 不依赖外部服务
- 快速执行

### 2. 集成测试 (Integration Tests)
- 测试组件间的交互
- 测试数据库操作
- 使用Mock外部服务

### 3. 端到端测试 (E2E Tests)
- 完整的用户流程测试
- 真实的用户交互

## 测试账号数据

为了测试目的，项目包含以下测试账号：

### 测试用户账号
```typescript
const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: '测试',
    lastName: '用户',
    phone: '+86 13800138000'
  },

  invalidUser: {
    email: 'invalid-email',
    password: '123', // 太弱
    firstName: '',
    lastName: ''
  },

  existingUser: {
    email: 'existing@example.com',
    password: 'Existing123!@#'
  }
}
```

## 数据库测试配置

测试环境使用独立的数据库表：
- `test_users` (用户表)
- `test_user_preferences` (用户偏好表)

测试数据会在每次测试运行前清理，确保测试隔离。

## Mock策略

### Supabase Mock
- 模拟所有Supabase客户端操作
- 返回预定义的测试数据
- 避免真实的网络请求

### 密码加密Mock
- 模拟PBKDF2��密过程
- 提供已知的测试用例
- 加快测试执行速度

## 测试最佳实践

1. **AAA模式**: Arrange-Act-Assert
2. **描述性测试名称**: 清楚说明测试目的
3. **测试隔离**: 每个测试独立运行
4. **边界测试**: 测试边界条件和异常情况
5. **快照测试**: 组件UI快照测试

## 调试测试

```bash
# 在测试中添加console.log进行调试
npm test -- --no-silent

# 使用Node.js调试器
node --inspect-brk node_modules/.bin/jest

# VSCode调试配置
# 在launch.json中添加Jest调试配置
```