-- Supabase 数据导入脚本
-- 将从 Neon 导出的数据导入到 Supabase
-- 在 Supabase SQL Editor 中执行此脚本

-- 注意：在执行此脚本之前，请确保已经运行了 migrate-to-supabase.sql

-- 插入用户数据示例 (请替换为从 Neon 导出的实际数据)
-- 格式：INSERT INTO test_users (id, email, first_name, last_name, phone, birth_date, gender, bio, avatar_url, created_at, updated_at) VALUES (...);

-- 示例数据插入 (如果表为空，可以插入一些测试数据)
INSERT INTO test_users (id, email, first_name, last_name, phone, birth_date, gender, bio, avatar_url, created_at, updated_at)
VALUES
    (
        gen_random_uuid(),
        'john.doe@example.com',
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

-- 获取插入的用户ID并插入对应的偏好设置
WITH inserted_users AS (
    SELECT id, email FROM test_users
    WHERE email IN ('john.doe@example.com', 'jane.smith@example.com')
)
INSERT INTO test_user_preferences (user_id, newsletter, notifications, privacy_public, marketing_emails, created_at)
SELECT
    id,
    CASE WHEN email = 'john.doe@example.com' THEN true ELSE false END,  -- John 订阅了 newsletter
    CASE WHEN email = 'john.doe@example.com' THEN true ELSE true END,   -- John 和 Jane 都开启通知
    CASE WHEN email = 'jane.smith@example.com' THEN true ELSE false END, -- Jane 设置公开资料
    CASE WHEN email = 'john.doe@example.com' THEN false ELSE true END,  -- 只有 Jane 接收营销邮件
    NOW()
FROM inserted_users
ON CONFLICT (user_id) DO NOTHING;

-- 验证数据导入结果
SELECT '数据导入验证结果' as info;

-- 检查用户表数据
SELECT
    '用户表数据统计' as table_info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_users,
    COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_users,
    COUNT(CASE WHEN gender = 'other' THEN 1 END) as other_users
FROM test_users;

-- 检查用户偏好设置表数据
SELECT
    '用户偏好表数据统计' as table_info,
    COUNT(*) as total_records,
    COUNT(CASE WHEN newsletter = true THEN 1 END) as newsletter_subscribers,
    COUNT(CASE WHEN notifications = true THEN 1 END) as notification_enabled,
    COUNT(CASE WHEN privacy_public = true THEN 1 END) as public_profiles,
    COUNT(CASE WHEN marketing_emails = true THEN 1 END) as marketing_subscribers
FROM test_user_preferences;

-- 检查用户与偏好设置的关联
SELECT
    '用户与偏好设置关联统计' as relationship_info,
    COUNT(u.id) as total_users,
    COUNT(p.id) as users_with_preferences,
    COUNT(u.id) - COUNT(p.id) as users_without_preferences
FROM test_users u
LEFT JOIN test_user_preferences p ON u.id = p.user_id;

-- 显示示例用户数据 (限制显示前5条)
SELECT
    '示例用户数据' as data_preview,
    id,
    email,
    first_name,
    last_name,
    gender,
    created_at
FROM test_users
ORDER BY created_at
LIMIT 5;

-- 显示示例偏好设置数据 (限制显示前5条)
SELECT
    '示例偏好设置数据' as data_preview,
    user_id,
    newsletter,
    notifications,
    privacy_public,
    marketing_emails,
    created_at
FROM test_user_preferences
ORDER BY created_at
LIMIT 5;

SELECT '数据导入脚本执行完成！' as completion_message;