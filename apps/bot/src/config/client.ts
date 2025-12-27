// Bot config client - fetches and caches config from API

import type { BotConfigDTO, ChannelConfigDTO } from '@asked-store/shared'

/**
 * Internal Bot Config Response (from API)
 */
interface InternalBotConfigResponse {
  bot: BotConfigDTO
  channel: ChannelConfigDTO
  allowedOps: string[]
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || ''
const CONFIG_REFRESH_INTERVAL_MS = parseInt(process.env.CONFIG_REFRESH_INTERVAL_MS || '300000', 10) // Default: 5 minutes
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000 // 1 second
const MAX_RETRY_DELAY_MS = 30000 // 30 seconds

interface ConfigCache {
  botConfig: BotConfigDTO | null
  channelConfig: ChannelConfigDTO | null
  allowedOps: string[]
  lastUpdated: Date | null
  lastSuccessfulUpdate: Date | null
  isInitialized: boolean
}

class BotConfigClient {
  private cache: ConfigCache = {
    botConfig: null,
    channelConfig: null,
    allowedOps: [],
    lastUpdated: null,
    lastSuccessfulUpdate: null,
    isInitialized: false,
  }

  private refreshTimer: NodeJS.Timeout | null = null
  private isRefreshing = false

  /**
   * Initialize config client - fetch config on startup
   */
  async initialize(): Promise<void> {
    if (this.cache.isInitialized) {
      return
    }

    console.log('🔄 Initializing bot config client...')
    const response = await this.fetchConfigWithRetry()
    
    this.cache.botConfig = response.bot
    this.cache.channelConfig = response.channel
    this.cache.allowedOps = response.allowedOps
    this.cache.lastUpdated = new Date()
    this.cache.lastSuccessfulUpdate = new Date()
    this.cache.isInitialized = true

    // Start periodic refresh
    this.startPeriodicRefresh()

    console.log('✅ Bot config initialized successfully')
  }

  /**
   * Get current bot config (from cache)
   */
  getBotConfig(): BotConfigDTO | null {
    return this.cache.botConfig
  }

  /**
   * Get bot config or throw if not available
   */
  getBotConfigOrThrow(): BotConfigDTO {
    if (!this.cache.botConfig) {
      throw new Error('Bot config not initialized. Call initialize() first.')
    }
    return this.cache.botConfig
  }

  /**
   * Get current channel config (from cache)
   */
  getChannelConfig(): ChannelConfigDTO | null {
    return this.cache.channelConfig
  }

  /**
   * Get channel config or throw if not available
   */
  getChannelConfigOrThrow(): ChannelConfigDTO {
    if (!this.cache.channelConfig) {
      throw new Error('Channel config not initialized. Call initialize() first.')
    }
    return this.cache.channelConfig
  }

  /**
   * Get allowed operations
   */
  getAllowedOps(): string[] {
    return this.cache.allowedOps
  }

  /**
   * Fetch config from API with retry and exponential backoff
   */
  private async fetchConfigWithRetry(retries = MAX_RETRIES): Promise<InternalBotConfigResponse> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.fetchConfig()
        return response
      } catch (error) {
        const isLastAttempt = attempt === retries - 1
        if (isLastAttempt) {
          // If we have cached configs, use them as fallback
          if (this.cache.botConfig && this.cache.channelConfig) {
            console.warn(`⚠️ Failed to fetch config after ${retries} attempts. Using cached configs as fallback.`)
            return {
              bot: this.cache.botConfig,
              channel: this.cache.channelConfig,
              allowedOps: this.cache.allowedOps,
            }
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
  private async fetchConfig(): Promise<InternalBotConfigResponse> {
    if (!INTERNAL_SERVICE_TOKEN) {
      throw new Error('INTERNAL_SERVICE_TOKEN is not set')
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}`,
    }

    const response = await fetch(`${BACKEND_URL}/internal/bot/config`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const config: InternalBotConfigResponse = await response.json()
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
        const response = await this.fetchConfigWithRetry()
        
        this.cache.botConfig = response.bot
        this.cache.channelConfig = response.channel
        this.cache.allowedOps = response.allowedOps
        this.cache.lastUpdated = new Date()
        this.cache.lastSuccessfulUpdate = new Date()
        
        console.log('✅ Bot config refreshed successfully')
      } catch (error) {
        console.error('❌ Failed to refresh bot config:', error)
        // Keep using cached configs (fallback)
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

