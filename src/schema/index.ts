import { pgTable, text, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core'

// 性别枚举
export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])

// 用户表
export const testUsers = pgTable('test_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  birthDate: text('birth_date'),
  gender: genderEnum('gender'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 用户偏好设置表
export const testUserPreferences = pgTable('test_user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => testUsers.id, { onDelete: 'cascade' }),
  newsletter: boolean('newsletter').default(false).notNull(),
  notifications: boolean('notifications').default(false).notNull(),
  privacyPublic: boolean('privacy_public').default(false).notNull(),
  marketingEmails: boolean('marketing_emails').default(false).notNull()
})

// 导出类型
export type TestUser = typeof testUsers.$inferSelect
export type NewTestUser = typeof testUsers.$inferInsert
export type TestUserPreferences = typeof testUserPreferences.$inferSelect
export type NewTestUserPreferences = typeof testUserPreferences.$inferInsert