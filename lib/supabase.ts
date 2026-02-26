import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import { Database } from '../supabase-types'


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

console.log('🔗 Supabase URL:', supabaseUrl)
console.log('🏠 Environment:', supabaseUrl.includes('127.0.0.1') ? 'LOCAL' : 'PRODUCTION')

const createWebStorage = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key)
      }
      return null
    },
    setItem: async (key: string, value: string): Promise<void> => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
      }
    },
    removeItem: async (key: string): Promise<void> => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key)
      }
    },
  }
}

const getStorage = () => {
  if (Platform.OS === 'web') {
    return createWebStorage()
  }
  return AsyncStorage
}

// Lazy initialization to avoid SSR issues
let supabaseInstance: SupabaseClient<Database> | null = null

const createSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
    },
  })

  // Only set up AppState listener for native platforms
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state: any) => {
      if (state === 'active') {
        supabaseInstance?.auth.startAutoRefresh()
      } else {
        supabaseInstance?.auth.stopAutoRefresh()
      }
    })
  }

  return supabaseInstance
}

// Export a getter function instead of the client directly
export const getSupabase = () => createSupabaseClient()

// For backward compatibility, export as supabase
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = createSupabaseClient()
    return client[prop as keyof SupabaseClient<Database>]
  }
})