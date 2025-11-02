# 数据库迁移指南：从 Neon 迁移到 Supabase

本指南将帮助你将数据库从 Neon 迁移到 Supabase serverless。

## 📋 迁移前准备

### 1. 备份现有数据
在开始迁移之前，请确保备份你的 Neon 数据库：

```sql
-- 在 Neon 中执行备份
pg_dump your_neon_database > neon_backup.sql
```

### 2. 检查环境配置
确认你的 `.env` 文件已正确配置 Supabase 连接信息：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 数据库连接（用于 Drizzle ORM）
VITE_SUPABASE_DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
SUPABASE_DB_PASSWORD=your-password
```

## 🚀 迁移步骤

### 方法 1：自动迁移（推荐）

1. **安装依赖**
   ```bash
   npm install
   ```

2. **运行自动迁移脚本**
   ```bash
   node scripts/migrate-database.js
   ```

### 方法 2：手动迁移

如果自动迁移失败，可以手动执行以下步骤：

#### 步骤 1：创建表结构

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 进入你的项目
3. 点击 "SQL Editor"
4. 复制并执行 `scripts/migrate-to-supabase.sql` 中的内容

#### 步骤 2：导出 Neon 数据

1. 在 Neon 中执行 `scripts/export-from-neon.sql`
2. 将查询结果保存为 CSV 或 JSON 格式

#### 步骤 3：导入数据到 Supabase

有两种导入方式：

**方式 A：使用 SQL 脚本**
- 修改 `scripts/import-to-supabase.sql` 中的数据
- 在 Supabase SQL Editor 中执行

**方式 B：使用 CSV 导入**
1. 在 Supabase Dashboard 中进入 "Table Editor"
2. 点击表名旁边的三个点
3. 选择 "Import from CSV"
4. 上传你的数据文件

## 🔍 验证迁移

### 1. 检查表结构
确认以下表已创建：

- `test_users` - 用户表
- `test_user_preferences` - 用户偏好设置表

### 2. 验证数据完整性

```sql
-- 检查用户数据
SELECT COUNT(*) as total_users FROM test_users;

-- 检查偏好设置数据
SELECT COUNT(*) as total_preferences FROM test_user_preferences;

-- 检查关联完整性
SELECT
  COUNT(u.id) as total_users,
  COUNT(p.id) as users_with_preferences
FROM test_users u
LEFT JOIN test_user_preferences p ON u.id = p.user_id;
```

### 3. 测试应用程序功能

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问应用并测试：
   - 用户注册功能
   - 数据查询功能
   - 用户偏好设置

## 🛠️ 故障排除

### 常见问题

**问题 1：连接错误**
```
Error: FATAL: no pg_hba.conf entry for host
```
**解决方案：** 检查 `VITE_SUPABASE_DATABASE_URL` 中的密码是否正确

**问题 2：表不存在错误**
```
Error: relation "test_users" does not exist
```
**解决方案：** 确保已成功执行 `migrate-to-supabase.sql`

**问题 3：权限错误**
```
Error: permission denied for table test_users
```
**解决方案：** 检查 RLS（Row Level Security）策略设置

### 重置迁移

如果需要重新开始迁移：

```sql
-- 删除所有表（谨慎操作！）
DROP TABLE IF EXISTS test_user_preferences CASCADE;
DROP TABLE IF EXISTS test_users CASCADE;

-- 删除枚举类型
DROP TYPE IF EXISTS gender CASCADE;
```

然后重新执行迁移步骤。

## 📊 迁移后优化

### 1. 性能优化

```sql
-- 创建额外的索引
CREATE INDEX CONCURRENTLY idx_test_users_last_name ON test_users(last_name);
CREATE INDEX CONCURRENTLY idx_test_users_birth_date ON test_users(birth_date);
```

### 2. 安全设置

- 确认 RLS 策略符合你的安全需求
- 设置适当的 API 密钥权限
- 配置网络访问限制

### 3. 监控设置

- 设置 Supabase 监控和告警
- 配置日志记录
- 设置备份策略

## 🔗 有用链接

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase 文档](https://supabase.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team)

## 📞 获取帮助

如果在迁移过程中遇到问题：

1. 检查 Supabase 项目的日志
2. 查看 Drizzle 配置是否正确
3. 确认环境变量设置无误
4. 参考本指南的故障排除部分

---

**注意：** 在生产环境中执行迁移前，建议先在开发环境中测试整个迁移过程。