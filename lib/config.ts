// lib/config.ts - Centralized configuration management

export interface DatabaseConfig {
  url: string
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface RedisConfig {
  url?: string
  host: string
  port: number
  password?: string
  db: number
}

export interface EmailConfig {
  smtp: {
    host: string
    port: number
    user: string
    password: string
    from: string
  }
  resend?: {
    apiKey: string
  }
}

export interface SecurityConfig {
  jwtSecret: string
  mfaIssuer: string
  encryptionKey: string
  allowedOrigins: string[]
}

export interface ExternalServicesConfig {
  orcid: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
  crossref: {
    username: string
    password: string
    apiUrl: string
  }
  turnitin?: {
    apiKey: string
    apiUrl: string
  }
  copyscape?: {
    username: string
    apiKey: string
  }
}

export class ConfigService {
  private static instance: ConfigService
  private config: Record<string, any> = {}

  private constructor() {
    this.loadConfiguration()
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  private loadConfiguration(): void {
    // Database configuration
    this.config.database = {
      url: this.getRequiredEnv('DATABASE_URL'),
      host: this.getEnv('DB_HOST', 'localhost'),
      port: parseInt(this.getEnv('DB_PORT', '5432')),
      database: this.getEnv('DB_NAME', 'amhsj'),
      username: this.getEnv('DB_USER', 'postgres'),
      password: this.getEnv('DB_PASSWORD', '')
    }

    // Redis configuration
    this.config.redis = {
      url: this.getEnv('REDIS_URL'),
      host: this.getEnv('REDIS_HOST', 'localhost'),
      port: parseInt(this.getEnv('REDIS_PORT', '6379')),
      password: this.getEnv('REDIS_PASSWORD'),
      db: parseInt(this.getEnv('REDIS_DB', '0'))
    }

    // Email configuration
    this.config.email = {
      smtp: {
        host: this.getRequiredEnv('SMTP_HOST'),
        port: parseInt(this.getRequiredEnv('SMTP_PORT')),
        user: this.getRequiredEnv('SMTP_USER'),
        password: this.getRequiredEnv('SMTP_PASSWORD'),
        from: this.getRequiredEnv('SMTP_FROM')
      },
      resend: this.getEnv('RESEND_API_KEY') ? {
        apiKey: this.getRequiredEnv('RESEND_API_KEY')
      } : undefined
    }

    // Security configuration
    this.config.security = {
      jwtSecret: this.getRequiredEnv('JWT_SECRET'),
      mfaIssuer: this.getEnv('MFA_ISSUER', 'Academic Journal'),
      encryptionKey: this.getRequiredEnv('ENCRYPTION_KEY'),
      allowedOrigins: this.getEnv('ALLOWED_ORIGINS', '').split(',').filter(Boolean)
    }

    // External services
    this.config.externalServices = {
      orcid: {
        clientId: this.getRequiredEnv('ORCID_CLIENT_ID'),
        clientSecret: this.getRequiredEnv('ORCID_CLIENT_SECRET'),
        redirectUri: this.getRequiredEnv('ORCID_REDIRECT_URI')
      },
      crossref: {
        username: this.getRequiredEnv('CROSSREF_USERNAME'),
        password: this.getRequiredEnv('CROSSREF_PASSWORD'),
        apiUrl: this.getEnv('CROSSREF_API_URL', 'https://api.crossref.org')
      },
      turnitin: this.getEnv('TURNITIN_API_KEY') ? {
        apiKey: this.getRequiredEnv('TURNITIN_API_KEY'),
        apiUrl: this.getEnv('TURNITIN_API_URL', 'https://app.ithenticate.com/api')
      } : undefined,
      copyscape: this.getEnv('COPYSCAPE_API_KEY') ? {
        username: this.getRequiredEnv('COPYSCAPE_USERNAME'),
        apiKey: this.getRequiredEnv('COPYSCAPE_API_KEY')
      } : undefined
    }

    // Application configuration
    this.config.app = {
      baseUrl: this.getRequiredEnv('NEXT_PUBLIC_BASE_URL'),
      environment: this.getEnv('NODE_ENV', 'development'),
      port: parseInt(this.getEnv('PORT', '3000')),
      maintenanceMode: this.getEnv('MAINTENANCE_MODE', 'false') === 'true'
    }
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
      throw new AppError(`Required environment variable ${key} is not set`)
    }
    return value
  }

  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database
  }

  getRedisConfig(): RedisConfig {
    return this.config.redis
  }

  getEmailConfig(): EmailConfig {
    return this.config.email
  }

  getSecurityConfig(): SecurityConfig {
    return this.config.security
  }

  getExternalServicesConfig(): ExternalServicesConfig {
    return this.config.externalServices
  }

  getAppConfig() {
    return this.config.app
  }

  getAllConfig() {
    return this.config
  }

  /**
   * Validate that all required configuration is present
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    try {
      this.loadConfiguration()
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown configuration error')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Export singleton instance
export const config = ConfigService.getInstance()

// Export convenience functions
export const getDatabaseConfig = () => config.getDatabaseConfig()
export const getRedisConfig = () => config.getRedisConfig()
export const getEmailConfig = () => config.getEmailConfig()
export const getSecurityConfig = () => config.getSecurityConfig()
export const getExternalServicesConfig = () => config.getExternalServicesConfig()
export const getAppConfig = () => config.getAppConfig()
export const validateConfig = () => config.validate() 