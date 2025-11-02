-- ========================================
-- Supabase 数据库迁移脚本（分步执行版）
-- 从 Neon 迁移到 Supabase
-- ========================================

-- 步骤 1: 创建基本表结构
-- 可以先执行这一部分，确保表创建成功
-- ========================================

-- 创建性别枚举类型
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

-- 创建用户表
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone VARCHAR,
    birth_date VARCHAR,
    gender gender,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建用户偏好设置表
CREATE TABLE IF NOT EXISTS test_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
    newsletter BOOLEAN DEFAULT FALSE NOT NULL,
    notifications BOOLEAN DEFAULT FALSE NOT NULL,
    privacy_public BOOLEAN DEFAULT FALSE NOT NULL,
    marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);
CREATE INDEX IF NOT EXISTS idx_test_users_created_at ON test_users(created_at);
CREATE INDEX IF NOT EXISTS idx_test_user_preferences_user_id ON test_user_preferences(user_id);

-- 插入一些示例数据（可选）
-- 注意：这里使用预计算的哈希密码示例
-- 实际应用中，密码应该在前端加密后再发送到后端
INSERT INTO test_users (id, email, password, first_name, last_name, phone, birth_date, gender, bio, avatar_url, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        'john.doe@example.com',
        '$pbkdf2$100000$a1b2c3d4e5f67890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        'John',
        'Doe',
        '+1234567890',
        '1990-01-15',
        'male',
        'Software developer passionate about web technologies',
        'https://example.com/avatars/john.jpg',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'jane.smith@example.com',
        '$pbkdf2$100000$b2c3d4e5f67890a1$bcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
        'Jane',
        'Smith',
        '+0987654321',
        '1992-05-20',
        'female',
        'UI/UX designer with a love for clean interfaces',
        'https://example.com/avatars/jane.jpg',
        NOW(),
        NOW()
    )
ON CONFLICT (email) DO NOTHING;

-- 验证表创建成功
SELECT 'Tables created successfully!' as status;

-- 检查创建的表
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('test_users', 'test_user_preferences')
ORDER BY table_name;

-- 检查数据
SELECT 'Sample data inserted!' as info;
SELECT COUNT(*) as user_count FROM test_users;

-- ========================================
-- 如果上面的步骤执行成功，再继续执行下面的部分
-- ========================================

-- 步骤 2: 添加高级功能（可选）
-- ========================================

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 test_users 表创建更新时间触发器
DROP TRIGGER IF EXISTS update_test_users_updated_at ON test_users;
CREATE TRIGGER update_test_users_updated_at
    BEFORE UPDATE ON test_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建基本的 RLS 策略
CREATE POLICY "Enable read access for all users" ON test_users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON test_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all preferences" ON test_user_preferences
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all preferences" ON test_user_preferences
    FOR INSERT WITH CHECK (true);

-- 验证所有功能
SELECT 'Full migration completed successfully!' as status;