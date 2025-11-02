-- ========================================
-- Supabase 安全迁移脚本（检查现有对象）
-- 从 Neon 迁移到 Supabase - 包含密码字段
-- ========================================

-- 1. 创建性别枚举类型（如果不存在）
DO $$
BEGIN
    CREATE TYPE gender AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '类型 "gender" 已存在，跳过创建';
END $$;

-- 2. 添加 password 字段到 test_users 表（如果不存在）
DO $$
BEGIN
    -- 检查表是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'test_users'
    ) THEN
        -- 创建完整的表
        CREATE TABLE test_users (
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
        RAISE NOTICE '创建了新表 test_users';
    ELSE
        -- 检查 password 字段是否存在
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'test_users'
              AND column_name = 'password'
        ) THEN
            -- 首先添加可空的 password 字段
            ALTER TABLE test_users ADD COLUMN password VARCHAR;
            RAISE NOTICE '为 test_users 表添加了 password 字段（可空）';

            -- 为现有记录设置默认密码（哈希后的 "password123"）
            UPDATE test_users
            SET password = '$pbkdf2$100000$a1b2c3d4e5f67890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
            WHERE password IS NULL;

            -- 将字段设置为 NOT NULL
            ALTER TABLE test_users ALTER COLUMN password SET NOT NULL;
            RAISE NOTICE '为现有记录设置了默认密码并设置 password 字段为 NOT NULL';
        ELSE
            RAISE NOTICE 'password 字段已存在，跳过添加';
        END IF;
    END IF;
END $$;

-- 3. 创建用户偏好设置表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'test_user_preferences'
    ) THEN
        CREATE TABLE test_user_preferences (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
            newsletter BOOLEAN DEFAULT FALSE NOT NULL,
            notifications BOOLEAN DEFAULT FALSE NOT NULL,
            privacy_public BOOLEAN DEFAULT FALSE NOT NULL,
            marketing_emails BOOLEAN DEFAULT FALSE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        RAISE NOTICE '创建了新表 test_user_preferences';
    END IF;
END $$;

-- 4. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);
CREATE INDEX IF NOT EXISTS idx_test_users_created_at ON test_users(created_at);
CREATE INDEX IF NOT EXISTS idx_test_user_preferences_user_id ON test_user_preferences(user_id);

-- 5. 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 创建更新时间触发器（如果不存在）
DROP TRIGGER IF EXISTS update_test_users_updated_at ON test_users;
CREATE TRIGGER update_test_users_updated_at
    BEFORE UPDATE ON test_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 启用行级安全策略 (RLS)
ALTER TABLE test_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_user_preferences ENABLE ROW LEVEL SECURITY;

-- 8. 创建RLS策略（安全处理）
DO $$
BEGIN
    -- 删除可能存在的策略
    DROP POLICY IF EXISTS "Enable read access for all users" ON test_users;
    DROP POLICY IF EXISTS "Enable insert for all users" ON test_users;
    DROP POLICY IF EXISTS "Enable read access for all preferences" ON test_user_preferences;
    DROP POLICY IF EXISTS "Enable insert for all preferences" ON test_user_preferences;

    -- 创建新的策略
    CREATE POLICY "Enable read access for all users" ON test_users
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert for all users" ON test_users
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Enable read access for all preferences" ON test_user_preferences
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert for all preferences" ON test_user_preferences
        FOR INSERT WITH CHECK (true);

    RAISE NOTICE '创建了 RLS 策略';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '创建策略时出现错误: %', SQLERRM;
END $$;

-- 9. 插入示例数据（仅当表为空时）
DO $$
BEGIN
    -- 检查是否有现有数据
    IF (SELECT COUNT(*) FROM test_users) = 0 THEN
        -- 插入示例数据（使用简单密码用于测试）
        INSERT INTO test_users (email, password, first_name, last_name, phone, birth_date, gender, bio, avatar_url, created_at, updated_at)
        VALUES
            (
                'john.doe@example.com',
                'password123', -- 实际应用中应该使用加密密码
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
                'jane.smith@example.com',
                'password123', -- 实际应用中应该使用加密密码
                'Jane',
                'Smith',
                '+0987654321',
                '1992-05-20',
                'female',
                'UI/UX designer with a love for clean interfaces',
                'https://example.com/avatars/jane.jpg',
                NOW(),
                NOW()
            );
        RAISE NOTICE '插入了示例数据';
    ELSE
        RAISE NOTICE '表中已有数据，跳过插入示例数据';
    END IF;
END $$;

-- 10. 验证迁移结果
SELECT 'Migration completed successfully!' as status;

-- 检查表结构
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'test_users'
ORDER BY ordinal_position;