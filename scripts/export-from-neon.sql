-- Neon 数据导出脚本
-- 在 Neon 数据库中执行此脚本来导出数据

-- 导出用户数据
SELECT
    id,
    email,
    first_name,
    last_name,
    phone,
    birth_date,
    gender,
    bio,
    avatar_url,
    created_at,
    updated_at
FROM test_users
ORDER BY created_at;

-- 导出用户偏好设置数据
SELECT
    id,
    user_id,
    newsletter,
    notifications,
    privacy_public,
    marketing_emails,
    created_at
FROM test_user_preferences
ORDER BY created_at;

-- 获取统计信息
SELECT
    'user_count' as metric,
    COUNT(*) as value
FROM test_users

UNION ALL

SELECT
    'preferences_count' as metric,
    COUNT(*) as value
FROM test_user_preferences

UNION ALL

SELECT
    'gender_distribution' as metric,
    gender || ': ' || COUNT(*) as value
FROM test_users
WHERE gender IS NOT NULL
GROUP BY gender

UNION ALL

SELECT
    'email_domain_distribution' as metric,
    SPLIT_PART(email, '@', 2) || ': ' || COUNT(*) as value
FROM test_users
GROUP BY SPLIT_PART(email, '@', 2)
ORDER BY COUNT(*) DESC;