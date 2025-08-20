/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOMEY_CLIENT_ID: string
  readonly VITE_HOMEY_CLIENT_SECRET: string
  readonly VITE_HOMEY_REDIRECT_URL: string
  // Add other VITE_ prefixed environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
