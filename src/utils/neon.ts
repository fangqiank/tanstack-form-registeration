// Neon 数据库配置 - 无服务器架构优化
// 支持多种部署模式：直接连接、Edge Functions、Vercel 等

const NEON_CONFIG = {
  // Neon 数据库连接配置
  databaseUrl: import.meta.env.VITE_NEON_DATABASE_URL || '',

  // 如果没有 Neon URL，提供示例配置
  fallbackConfig: {
    host: import.meta.env.VITE_NEON_HOST || 'localhost',
    port: Number(import.meta.env.VITE_NEON_PORT) || 5432,
    database: import.meta.env.VITE_NEON_DATABASE || 'neondb',
    user: import.meta.env.VITE_NEON_USER || 'neondb_owner',
    password: import.meta.env.VITE_NEON_PASSWORD || ''
  },

  // 无服务器架构配置
  serverless: {
    // 连接模式：'direct' | 'edge' | 'api'
    mode: (import.meta.env.VITE_NEON_MODE as 'direct' | 'edge' | 'api') || 'direct',

    // Edge Functions 配置
    edgeUrl: import.meta.env.VITE_NEON_EDGE_URL || '/api/neon',

    // 连接池配置（无服务器环境建议使用较小值）
    maxConnections: Number(import.meta.env.VITE_NEON_MAX_CONNECTIONS) || 1,

    // 超时配置（毫秒）
    connectionTimeout: Number(import.meta.env.VITE_NEON_TIMEOUT) || 10000,

    // 重试配置
    maxRetries: Number(import.meta.env.VITE_NEON_MAX_RETRIES) || 3,

    // 缓存配置
    enableCache: import.meta.env.VITE_NEON_ENABLE_CACHE !== 'false',
    cacheTTL: Number(import.meta.env.VITE_NEON_CACHE_TTL) || 300000, // 5分钟
  }
}

// 创建数据库连接字符串
function getDatabaseUrl(): string {
  if (NEON_CONFIG.databaseUrl) {
    return NEON_CONFIG.databaseUrl
  }

  const { fallbackConfig } = NEON_CONFIG
  return `postgresql://${fallbackConfig.user}:${fallbackConfig.password}@${fallbackConfig.host}:${fallbackConfig.port}/${fallbackConfig.database}`
}

// 数据库连接池配置
const poolConfig = {
  connectionString: getDatabaseUrl(),
  ssl: {
    rejectUnauthorized: false // 在开发环境中允许自签名证书
  },
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

export { getDatabaseUrl, poolConfig, NEON_CONFIG }