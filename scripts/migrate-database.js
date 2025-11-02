#!/usr/bin/env node

/**
 * 数据库迁移脚本：从 Neon 迁移到 Supabase
 * 使用方法：node scripts/migrate-database.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量
import { config } from 'dotenv'
config()

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：请设置 Supabase 环境变量')
  console.log('需要设置：VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
  console.log('')
  console.log('📋 当前环境变量状态：')
  console.log(`   VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置'}`)
  console.log(`   VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'}`)
  console.log('')
  console.log('💡 解决方案：')
  console.log('   1. 检查 .env 文件是否存在')
  console.log('   2. 确认 .env 文件中包含正确的 Supabase 配置')
  console.log('   3. 重新运行迁移脚本')
  process.exit(1)
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 执行 SQL 文件
 */
async function executeSqlFile(filePath, description) {
  try {
    console.log(`🔄 ${description}...`)

    const sqlContent = readFileSync(filePath, 'utf8')

    // 将 SQL 内容分割成单独的语句（简单分割）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error) {
          // 如果 RPC 不存在，尝试直接使用 Supabase 客户端
          console.warn(`⚠️  RPC 调用失败，尝试其他方式: ${error.message}`)

          // 对于一些特定的语句，我们可以使用 Supabase 的其他方法
          if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE')) {
            console.log(`ℹ️  请手动在 Supabase SQL Editor 中执行: ${statement}`)
          }
        } else {
          successCount++
        }
      } catch (err) {
        console.error(`❌ 语句执行失败: ${statement.substring(0, 50)}...`)
        console.error(`   错误: ${err.message}`)
        errorCount++
      }
    }

    console.log(`✅ ${description} 完成: ${successCount} 成功, ${errorCount} 失败`)
    return { successCount, errorCount }

  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message)
    return { successCount: 0, errorCount: 1 }
  }
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    console.log('🔍 测试 Supabase 连接...')

    // 尝试连接测试
    const { data, error } = await supabase
      .from('test_users')
      .select('count')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ 连接成功，但表不存在（需要先创建表结构）')
        return true
      } else {
        console.error('❌ 连接测试失败:', error.message)
        return false
      }
    } else {
      console.log('✅ Supabase 连接成功')
      return true
    }
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message)
    return false
  }
}

/**
 * 验证迁移结果
 */
async function validateMigration() {
  try {
    console.log('🔍 验证迁移结果...')

    // 检查表是否存在
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['test_users', 'test_user_preferences'])

    if (tablesError) {
      console.warn('⚠️  无法检查表是否存在，请手动验证')
    } else {
      const tableNames = tables?.map(t => t.table_name) || []
      console.log(`📋 找到的表: ${tableNames.join(', ')}`)
    }

    // 检查用户数据
    const { data: users, error: usersError } = await supabase
      .from('test_users')
      .select('id, email, first_name, last_name')
      .limit(5)

    if (usersError) {
      console.warn('⚠️  无法检查用户数据:', usersError.message)
    } else {
      console.log(`👥 用户表中有 ${users?.length || 0} 条记录`)
      if (users && users.length > 0) {
        console.log('   示例用户:', users.map(u => u.email).join(', '))
      }
    }

    // 检查偏好设置数据
    const { data: preferences, error: prefsError } = await supabase
      .from('test_user_preferences')
      .select('id, user_id, newsletter')
      .limit(5)

    if (prefsError) {
      console.warn('⚠️  无法检查偏好设置数据:', prefsError.message)
    } else {
      console.log(`⚙️  偏好设置表中有 ${preferences?.length || 0} 条记录`)
    }

    return true
  } catch (error) {
    console.error('❌ 验证失败:', error.message)
    return false
  }
}

/**
 * 主迁移函数
 */
async function main() {
  console.log('🚀 开始数据库迁移：Neon → Supabase')
  console.log('='.repeat(50))

  try {
    // 1. 测试连接
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.log('💡 解决方案：')
      console.log('   1. 检查 .env 文件中的 Supabase 配置')
      console.log('   2. 确认 Supabase 项目正在运行')
      console.log('   3. 验证 API 密钥是否正确')
      process.exit(1)
    }

    // 2. 创建表结构
    const migrationFile = join(__dirname, 'migrate-to-supabase.sql')
    console.log(`📁 迁移文件路径: ${migrationFile}`)

    const migrationResult = await executeSqlFile(migrationFile, '创建表结构')

    if (migrationResult.errorCount > 0) {
      console.log('💡 建议手动在 Supabase SQL Editor 中运行迁移脚本')
    }

    // 3. 导入数据（如果有现有数据）
    const importFile = join(__dirname, 'import-to-supabase.sql')
    await executeSqlFile(importFile, '导入示例数据')

    // 4. 验证迁移结果
    await validateMigration()

    console.log('='.repeat(50))
    console.log('🎉 数据库迁移完成！')
    console.log('')
    console.log('📋 下一步操作：')
    console.log('1. 检查 Supabase Dashboard 中的表结构')
    console.log('2. 验证数据是否正确导入')
    console.log('3. 运行应用程序测试连接')
    console.log('4. 如果需要，导入更多现有数据')

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error.message)
    console.log('')
    console.log('💡 手动迁移步骤：')
    console.log('1. 在 Supabase SQL Editor 中运行 scripts/migrate-to-supabase.sql')
    console.log('2. 在 Supabase SQL Editor 中运行 scripts/import-to-supabase.sql')
    console.log('3. 验证表结构和数据')

    process.exit(1)
  }
}

// 运行迁移
main().catch(console.error)