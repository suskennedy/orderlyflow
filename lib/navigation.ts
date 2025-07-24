import { router } from 'expo-router';

// Type-safe navigation helper with only current functionality
export const navigate = {
  // Auth routes
  toSignIn: () => router.push('/(auth)/signin'),
  toSignUp: () => router.push('/(auth)/signup'),
  toForgotPassword: () => router.push('/(auth)/forgot-password'),
  
  // Dashboard routes - using the correct route group structure
  toDashboard: () => router.replace('/(dashboard)'),
  toHomes: () => router.replace('/(dashboard)/homes'),
  toVendors: () => router.replace('/(dashboard)/vendors'),
  toTasks: () => router.push('/(dashboard)/tasks'),
  toInventory: () => router.push('/(dashboard)/inventory'),
  toCalendar: () => router.push('/(dashboard)/calendar'),
  toSettings: () => router.push('/(dashboard)/settings'),
  
  // Generic navigation
  back: () => router.back(),
  canGoBack: () => router.canGoBack(),
  replace: (route: string) => router.replace(route),
};

export default navigate; 