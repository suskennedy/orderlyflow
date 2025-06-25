import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import { Database } from '../supabase'

// `react-native-url-polyfill/auto` is required at the top-level to make
// Node.js URL APIs available in React Native environments.
import 'react-native-url-polyfill/auto'

// IMPORTANT: the extra trailing space at the end of the URL was breaking
// requests made by the Supabase client.  Removing it prevents subtle
// "Invalid URL" or networking errors at runtime.

const supabaseUrl = 'https://ejgifuogadturszndnfo.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZ2lmdW9nYWR0dXJzem5kbmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MDUzMjIsImV4cCI6MjA2MzA4MTMyMn0.tYMDIK2DpQq21o6Wlic7tFp4ODPg7JdP7_ikjUs4sOE'

// Create web-compatible storage that handles SSR
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

// Use appropriate storage based on platform and environment
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
    AppState.addEventListener('change', (state) => {
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