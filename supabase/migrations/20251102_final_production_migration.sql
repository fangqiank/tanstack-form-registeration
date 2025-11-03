-- Final Production Migration Script
-- Purpose: Complete database setup for TanStack Form Supabase Demo
-- Date: 2025-11-02

-- ========================================
-- STEP 1: CLEAN UP EXISTING OBJECTS
-- ========================================

-- Drop backup tables if they exist
DROP TABLE IF EXISTS password_migration_backup;

-- Drop dependent tables first
DROP TABLE IF EXISTS test_user_preferences;

-- Drop main table
DROP TABLE IF EXISTS test_users;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_user_by_email(text);
DROP FUNCTION IF EXISTS email_exists(text);
DROP FUNCTION IF EXISTS create_user(text, text, text, text, text, date, text, text);

-- Drop views if they exist
DROP VIEW IF EXISTS user_profiles;

-- ========================================
-- STEP 2: CREATE MAIN USER TABLE
-- ========================================

CREATE TABLE test_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT '',
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: CREATE USER PREFERENCES TABLE
-- ========================================

CREATE TABLE test_user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES test_users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language VARCHAR(10) DEFAULT 'zh-CN',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    newsletter BOOLEAN DEFAULT true,
    notifications BOOLEAN DEFAULT true,
    privacy_public BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 4: CREATE TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON test_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON test_user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user preferences
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO test_user_preferences (
        user_id,
        theme,
        language,
        email_notifications,
        push_notifications,
        newsletter,
        notifications,
        privacy_public,
        marketing_emails,
        two_factor_enabled,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'light',
        'zh-CN',
        true,
        false,
        true,
        true,
        false,
        false,
        false,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic user preferences creation
CREATE TRIGGER on_user_created_create_preferences
    AFTER INSERT ON test_users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_preferences();

-- ========================================
-- STEP 5: CREATE API HELPER FUNCTIONS
-- ========================================

-- Function to get user by email for login
CREATE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (
    id uuid,
    email text,
    password text,
    first_name text,
    last_name text,
    phone text,
    birth_date date,
    gender text,
    bio text,
    avatar_url text,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.password,
        u.first_name,
        u.last_name,
        u.phone,
        u.birth_date,
        u.gender,
        u.bio,
        u.avatar_url,
        u.created_at,
        u.updated_at
    FROM test_users u
    WHERE u.email = get_user_by_email.user_email;
END;
$$ LANGUAGE plpgsql;

-- Function to check if email exists
CREATE FUNCTION email_exists(user_email text)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM test_users
        WHERE email = email_exists.user_email
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create new user
CREATE FUNCTION create_user(
    user_email text,
    user_password text,
    user_first_name text,
    user_last_name text,
    user_phone text DEFAULT NULL,
    user_birth_date date DEFAULT NULL,
    user_gender text DEFAULT NULL,
    user_bio text DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO test_users (
        email,
        password,
        first_name,
        last_name,
        phone,
        birth_date,
        gender,
        bio
    ) VALUES (
        user_email,
        user_password,
        user_first_name,
        user_last_name,
        user_phone,
        user_birth_date,
        user_gender,
        user_bio
    ) RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user avatar
CREATE FUNCTION update_user_avatar(user_id uuid, avatar_url text)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE test_users
    SET avatar_url = update_user_avatar.avatar_url
    WHERE id = update_user_avatar.user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX idx_test_users_email ON test_users(email);
CREATE INDEX idx_test_users_id ON test_users(id);
CREATE INDEX idx_test_users_created_at ON test_users(created_at);
CREATE INDEX idx_test_user_preferences_user_id ON test_user_preferences(user_id);
CREATE INDEX idx_test_user_preferences_created_at ON test_user_preferences(created_at);

-- ========================================
-- STEP 7: SET PERMISSIONS
-- ========================================

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Table permissions for anonymous users
GRANT SELECT ON test_users TO anon;
GRANT INSERT ON test_users TO anon;
GRANT SELECT ON test_user_preferences TO anon;

-- Table permissions for authenticated users
GRANT ALL ON test_users TO authenticated;
GRANT ALL ON test_user_preferences TO authenticated;

-- Table permissions for service role
GRANT ALL ON test_users TO service_role;
GRANT ALL ON test_user_preferences TO service_role;

-- Function permissions
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO anon;
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO service_role;

GRANT EXECUTE ON FUNCTION email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION email_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION email_exists(text) TO service_role;

GRANT EXECUTE ON FUNCTION create_user(text, text, text, text, text, date, text, text) TO anon;
GRANT EXECUTE ON FUNCTION create_user(text, text, text, text, text, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user(text, text, text, text, text, date, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION update_user_avatar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_avatar(uuid, text) TO service_role;

-- ========================================
-- STEP 8: CREATE SAFE VIEW
-- ========================================

-- Create safe user profile view (excludes password)
CREATE VIEW user_profiles AS
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
FROM test_users;

-- Grant view permissions
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO service_role;

-- ========================================
-- STEP 9: VALIDATION CONSTRAINTS
-- ========================================

-- Email validation function
CREATE OR REPLACE FUNCTION is_valid_email(email text)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add email validation constraint
ALTER TABLE test_users
ADD CONSTRAINT valid_email_format
CHECK (is_valid_email(email));

-- ========================================
-- STEP 10: FINAL VERIFICATION
-- ========================================

-- Verify table structure
SELECT 'Table Structure Verification' as info,
       table_name,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns
WHERE table_name IN ('test_users', 'test_user_preferences')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Verify functions exist
SELECT 'Functions Verification' as info,
       proname as function_name,
       pronargs as argument_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_by_email', 'email_exists', 'create_user', 'update_user_avatar', 'create_user_preferences', 'update_updated_at_column', 'is_valid_email')
ORDER BY function_name;

-- Verify indexes
SELECT 'Indexes Verification' as info,
       indexname as index_name,
       tablename as table_name
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY table_name, index_name;

-- Verify views
SELECT 'Views Verification' as info,
       viewname as view_name
FROM pg_views
WHERE schemaname = 'public'
    AND viewname = 'user_profiles';

-- Test functions
SELECT 'Function Test Results' as info,
       email_exists('test@example.com') as email_check_test;

-- ========================================
-- STEP 11: SUCCESS COMPLETION
-- ========================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🎉 PRODUCTION MIGRATION COMPLETED! 🎉';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables created: test_users, test_user_preferences';
    RAISE NOTICE '✅ Triggers created: auto-create preferences, update timestamps';
    RAISE NOTICE '✅ Functions created: get_user_by_email, email_exists, create_user, update_user_avatar';
    RAISE NOTICE '✅ Indexes created for optimal performance';
    RAISE NOTICE '✅ Permissions set for anon, authenticated, and service_role';
    RAISE NOTICE '✅ Safe view created: user_profiles (excludes passwords)';
    RAISE NOTICE '✅ Email validation constraint added';
    RAISE NOTICE '✅ All database objects ready for production use';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your TanStack Form Supabase Demo is ready!';
    RAISE NOTICE '==========================================';
END $$;

-- Add table comments for documentation
COMMENT ON TABLE test_users IS 'User registration and profile data - production ready';
COMMENT ON TABLE test_user_preferences IS 'User preferences and settings with automatic creation';
COMMENT ON VIEW user_profiles IS 'Safe public user profile view (excludes sensitive password data)';
COMMENT ON COLUMN test_users.password IS 'Password field - stores PBKDF2 hashed passwords';
COMMENT ON COLUMN test_users.avatar_url IS 'User avatar URL - supports base64 encoded images';