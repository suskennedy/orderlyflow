import { StackScreenProps } from '@react-navigation/stack';

// Define all possible routes in the app
export type RootStackParamList = {
  // Root routes
  index: undefined;
  
  // Auth routes
  '(auth)/signin': undefined;
  '(auth)/signup': undefined;
  '(auth)/forgot-password': undefined;
  '(auth)/reset-password': undefined;
  
  // Dashboard routes
  '(dashboard)/index': undefined;
  '(dashboard)/tasks': undefined;
  '(dashboard)/inventory': undefined;
  '(dashboard)/calendar': undefined;
  '(dashboard)/settings': undefined;
  
  // Task routes
  'tasks/add': undefined;
  'tasks/[id]': { id: string };
  
  // Inventory routes
  'inventory/appliances/add': undefined;
  'inventory/filters/add': undefined;
  'inventory/lights/add': undefined;
  'inventory/paint/add': undefined;
  'inventory/tiles/add': undefined;
  'inventory/cabinets/add': undefined;
  'inventory/infrastructure/add': undefined;
  'inventory/[category]/[id]': { category: string; id: string };
  
  // Home routes
  'homes/add': undefined;
  'homes/manage': undefined;
  'homes/[id]': { id: string };
  
  // Calendar routes
  'calendar/add': undefined;
  'calendar/[id]': { id: string };
  
  // Profile routes
  'profile/edit': undefined;
  
  // Settings routes
  'settings/export': undefined;
  'settings/privacy': undefined;
  'settings/help': undefined;
  'settings/feedback': undefined;
  'settings/about': undefined;
  
  // Dynamic catch-all for any other routes
  [key: string]: undefined | { [key: string]: any };
};

// Auth stack specific routes
export type AuthStackParamList = {
  signin: undefined;
  signup: undefined;
  'forgot-password': undefined;
  'reset-password': undefined;
};

// Dashboard tab routes
export type DashboardTabParamList = {
  index: undefined;
  tasks: undefined;
  inventory: undefined;
  calendar: undefined;
  settings: undefined;
};

// Inventory specific routes
export type InventoryStackParamList = {
  'appliances/add': undefined;
  'filters/add': undefined;
  'lights/add': undefined;
  'paint/add': undefined;
  'tiles/add': undefined;
  'cabinets/add': undefined;
  'infrastructure/add': undefined;
  '[category]/[id]': { category: string; id: string };
};

// Task specific routes
export type TaskStackParamList = {
  'add': undefined;
  '[id]': { id: string };
};

// Home specific routes
export type HomeStackParamList = {
  'add': undefined;
  'manage': undefined;
  '[id]': { id: string };
};

// Calendar specific routes
export type CalendarStackParamList = {
  'add': undefined;
  '[id]': { id: string };
};

// Settings specific routes
export type SettingsStackParamList = {
  'export': undefined;
  'privacy': undefined;
  'help': undefined;
  'feedback': undefined;
  'about': undefined;
};

// Profile specific routes
export type ProfileStackParamList = {
  'edit': undefined;
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type DashboardTabScreenProps<T extends keyof DashboardTabParamList> = StackScreenProps<
  DashboardTabParamList,
  T
>;

export type InventoryStackScreenProps<T extends keyof InventoryStackParamList> = StackScreenProps<
  InventoryStackParamList,
  T
>;

export type TaskStackScreenProps<T extends keyof TaskStackParamList> = StackScreenProps<
  TaskStackParamList,
  T
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = StackScreenProps<
  HomeStackParamList,
  T
>;

export type CalendarStackScreenProps<T extends keyof CalendarStackParamList> = StackScreenProps<
  CalendarStackParamList,
  T
>;

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> = StackScreenProps<
  SettingsStackParamList,
  T
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = StackScreenProps<
  ProfileStackParamList,
  T
>;

// Utility type for router.push() to accept any route
export type RouteString = keyof RootStackParamList | string;

// Declare global types for expo-router
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Export a helper type for route parameters
export type RouteParams<T extends keyof RootStackParamList> = RootStackParamList[T];
