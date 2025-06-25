import { router } from 'expo-router';

// Type-safe navigation helper with only current functionality
export const navigate = {
  // Auth routes
  toSignIn: () => router.push('/(auth)/signin' as any),
  toSignUp: () => router.push('/(auth)/signup' as any),
  toForgotPassword: () => router.push('/(auth)/forgot-password' as any),
  
  // Dashboard routes - using the correct route group structure
  toDashboard: () => router.replace('/(dashboard)' as any),
  toTasks: () => router.push('/(dashboard)/tasks' as any),
  toInventory: () => router.push('/(dashboard)/inventory' as any),
  toCalendar: () => router.push('/(dashboard)/calendar' as any),
  toSettings: () => router.push('/(dashboard)/settings' as any),
  
  // Generic navigation
  back: () => router.back(),
  canGoBack: () => router.canGoBack(),
  replace: (route: string) => router.replace(route as any),
};

export default navigate; 