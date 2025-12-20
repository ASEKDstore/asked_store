/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE?: string
  readonly VITE_ADMIN_TG_IDS?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Build-time constants (defined in vite.config.js)
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
declare const __GIT_COMMIT__: string



