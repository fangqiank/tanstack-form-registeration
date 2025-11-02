-- 数据库迁移脚本: 从 Neon 迁移到 Supabase
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建性别枚举类型
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

-- 2. 创建用户表 (test_users)
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL UNIQUE,
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

-- 3. 创建用户偏好设置表 (test_user_preferences)
CREATE TABLE IF NOT EXISTS test_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
    newsletter BOOLEAN DEFAULT FALSE NOT NULL,
    notifications BOOLEAN DEFAULT FALSE NOT NULL,
    privacy_public BOOLEAN DEFAULT FALSE NOT NULL,
    marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);
CREATE INDEX IF NOT EXISTS idx_test_users_created_at ON test_users(created_at);
CREATE INDEX IF NOT EXISTS idx_test_user_preferences_user_id ON test_user_preferences(user_id);

-- 5. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 为 test_users 表创建更新时间触发器
DROP TRIGGER IF EXISTS update_test_users_updated_at ON test_users;
CREATE TRIGGER update_test_users_updated_at
    BEFORE UPDATE ON test_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 启用行级安全策略 (RLS)
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_user_preferences ENABLE ROW LEVEL SECURITY;

-- 8. 创建 RLS 策略 (允许匿名用户读取和插入，但限制更新和删除)
-- 用户表策略
CREATE POLICY "Users can view all profiles" ON test_users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON test_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON test_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 用户偏好设置表策略
CREATE POLICY "Users can view all preferences" ON test_user_preferences
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own preferences" ON test_user_preferences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own preferences" ON test_user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 9. 创建用于数据统计的函数
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    male_users BIGINT,
    female_users BIGINT,
    other_users BIGINT,
    public_profiles BIGINT,
    newsletter_subscribers BIGINT,
    marketing_subscribers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN u.gender = 'male' THEN 1 END) as male_users,
        COUNT(CASE WHEN u.gender = 'female' THEN 1 END) as female_users,
        COUNT(CASE WHEN u.gender = 'other' THEN 1 END) as other_users,
        COUNT(CASE WHEN p.privacy_public = true THEN 1 END) as public_profiles,
        COUNT(CASE WHEN p.newsletter = true THEN 1 END) as newsletter_subscribers,
        COUNT(CASE WHEN p.marketing_emails = true THEN 1 END) as marketing_subscribers
    FROM test_users u
    LEFT JOIN test_user_preferences p ON u.id = p.user_id;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建用于检查邮箱是否存在的函数
CREATE OR REPLACE FUNCTION check_email_exists(email_param VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM test_users
        WHERE email = email_param
    );
END;
$$ LANGUAGE plpgsql;

-- 11. 创建获取用户完整信息的函数
CREATE OR REPLACE FUNCTION get_user_with_preferences(email_param VARCHAR)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    birth_date VARCHAR,
    gender gender,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    newsletter BOOLEAN,
    notifications BOOLEAN,
    privacy_public BOOLEAN,
    marketing_emails BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.birth_date,
        u.gender,
        u.bio,
        u.avatar_url,
        u.created_at,
        u.updated_at,
        p.newsletter,
        p.notifications,
        p.privacy_public,
        p.marketing_emails
    FROM test_users u
    LEFT JOIN test_user_preferences p ON u.id = p.user_id
    WHERE u.email = email_param;
END;
$$ LANGUAGE plpgsql;

-- 完成迁移提示
SELECT 'Database schema migration completed successfully!' as message;