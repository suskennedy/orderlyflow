/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string
    EXPO_PUBLIC_RESEND_API_KEY: string
    EXPO_PUBLIC_APP_URL: string
    EXPO_PUBLIC_FROM_EMAIL: string
  }
}
