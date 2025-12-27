// Bot config client - fetches and caches config from API

import type { BotConfigDTO } from '@asked-store/shared'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || process.env.BOT_SERVICE_TOKEN || ''
const SERVICE_SECRET = process.env.SERVICE_SECRET || process.env.BOT_SERVICE_SECRET || ''
const CONFIG_REFRESH_INTERVAL_MS = parseInt(process.env.CONFIG_REFRESH_INTERVAL_MS || '300000', 10) // Default: 5 minutes
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000 // 1 second
const MAX_RETRY_DELAY_MS = 30000 // 30 seconds

interface ConfigCache {
  config: BotConfigDTO | null
  lastUpdated: Date | null
  lastSuccessfulUpdate: Date | null
  isInitialized: boolean
}

class BotConfigClient {
  private cache: ConfigCache = {
    config: null,
    lastUpdated: null,
    lastSuccessfulUpdate: null,
    isInitialized: false,
  }

  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false

  /**
   * Initialize config client - fetch config on startup
   */
  async initialize(): Promise<BotConfigDTO> {
    if (this.cache.isInitialized && this.cache.config) {
      return this.cache.config
    }

    console.log('🔄 Initializing bot config client...')
    const config = await this.fetchConfigWithRetry()
    
    this.cache.config = config
    this.cache.lastUpdated = new Date()
    this.cache.lastSuccessfulUpdate = new Date()
    this.cache.isInitialized = true

    // Start periodic refresh
    this.startPeriodicRefresh()

    console.log('✅ Bot config initialized successfully')
    return config
  }

  /**
   * Get current config (from cache)
   */
  getConfig(): BotConfigDTO | null {
    return this.cache.config
  }

  /**
   * Get config or throw if not available
   */
  getConfigOrThrow(): BotConfigDTO {
    if (!this.cache.config) {
      throw new Error('Bot config not initialized. Call initialize() first.')
    }
    return this.cache.config
  }

  /**
   * Fetch config from API with retry and exponential backoff
   */
  private async fetchConfigWithRetry(retries = MAX_RETRIES): Promise<BotConfigDTO> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const config = await this.fetchConfig()
        return config
      } catch (error) {
        const isLastAttempt = attempt === retries - 1
        if (isLastAttempt) {
          // If we have a cached config, use it as fallback
          if (this.cache.config) {
            console.warn(`⚠️ Failed to fetch config after ${retries} attempts. Using cached config as fallback.`)
            return this.cache.config
          }
          throw new Error(`Failed to fetch bot config after ${retries} attempts: ${error}`)
        }

        // Exponential backoff
        const delay = Math.min(
          INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt),
          MAX_RETRY_DELAY_MS
        )
        console.warn(`⚠️ Config fetch failed (attempt ${attempt + 1}/${retries}), retrying in ${delay}ms...`)
        await this.sleep(delay)
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unexpected error in fetchConfigWithRetry')
  }

  /**
   * Fetch config from API
   */
  private async fetchConfig(): Promise<BotConfigDTO> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add authentication header
    if (SERVICE_TOKEN) {
      headers['Authorization'] = `Bearer ${SERVICE_TOKEN}`
    } else if (SERVICE_SECRET) {
      headers['X-Service-Secret'] = SERVICE_SECRET
    }

    const response = await fetch(`${BACKEND_URL}/internal/bot/config`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const config: BotConfigDTO = await response.json()
    return config
  }

  /**
   * Start periodic config refresh
   */
  private startPeriodicRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    this.refreshTimer = setInterval(async () => {
      if (this.isRefreshing) {
        return // Skip if already refreshing
      }

      this.isRefreshing = true
      try {
        console.log('🔄 Refreshing bot config...')
        const config = await this.fetchConfigWithRetry()
        
        this.cache.config = config
        this.cache.lastUpdated = new Date()
        this.cache.lastSuccessfulUpdate = new Date()
        
        console.log('✅ Bot config refreshed successfully')
      } catch (error) {
        console.error('❌ Failed to refresh bot config:', error)
        // Keep using cached config (fallback)
      } finally {
        this.isRefreshing = false
      }
    }, CONFIG_REFRESH_INTERVAL_MS)

    console.log(`⏰ Config refresh scheduled every ${CONFIG_REFRESH_INTERVAL_MS / 1000} seconds`)
  }

  /**
   * Stop periodic refresh
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const botConfigClient = new BotConfigClient()

