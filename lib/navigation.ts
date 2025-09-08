import { router } from 'expo-router';

// Unified routes object for the new directory structure
export const routes = {
  // Auth routes
  auth: {
    signin: '/(auth)/signin',
    signup: '/(auth)/signup',
    forgotPassword: '/(auth)/forgot-password',
  },
  
  // Main tabs routes
  tabs: {
    dashboard: '/(tabs)/(dashboard)',
    homes: '/(tabs)/(home)',
    tasks: '/(tabs)/(tasks)',
    vendors: '/(tabs)/(vendors)',
    flo: '/(tabs)/(flo)',
    settings: '/(tabs)/(settings)',
    calendar: '/(tabs)/(calendar)',
  },
  
  // Dashboard routes
  dashboard: {
    index: '/(tabs)/(dashboard)',
    tasks: '/(tabs)/(tasks)',
    homes: '/(tabs)/(home)',
    vendors: '/(tabs)/(vendors)',
    calendar: '/(tabs)/(calendar)',
    inventory: '/(tabs)/(dashboard)/inventory',
  },
  
  // Home routes
  home: {
    index: '/(tabs)/(home)',
    add: '/(tabs)/(home)/add',
    detail: (homeId: string) => `/(tabs)/(home)/${homeId}`,
    edit: (homeId: string) => `/(tabs)/(home)/${homeId}/edit`,
    info: (homeId: string) => `/(tabs)/(home)/${homeId}/info`,
    appliances: (homeId: string) => `/(tabs)/(home)/${homeId}/appliances`,
    addAppliance: (homeId: string) => `/(tabs)/(home)/${homeId}/appliances/add`,
    applianceDetail: (homeId: string, applianceId: string) => `/(tabs)/(home)/${homeId}/appliances/${applianceId}`,
    editAppliance: (homeId: string, applianceId: string) => `/(tabs)/(home)/${homeId}/appliances/${applianceId}/edit`,
    filters: (homeId: string) => `/(tabs)/(home)/${homeId}/filters`,
    addFilter: (homeId: string) => `/(tabs)/(home)/${homeId}/filters/add`,
    materials: (homeId: string) => `/(tabs)/(home)/${homeId}/materials`,
    addMaterial: (homeId: string) => `/(tabs)/(home)/${homeId}/materials/add`,
    editMaterial: (homeId: string, materialId: string) => `/(tabs)/(home)/${homeId}/materials/${materialId}/edit`,
    paints: (homeId: string) => `/(tabs)/(home)/${homeId}/paints`,
    addPaint: (homeId: string) => `/(tabs)/(home)/${homeId}/paints/add`,
    editPaint: (homeId: string, paintId: string) => `/(tabs)/(home)/${homeId}/paints/${paintId}/edit`,
    warranties: (homeId: string) => `/(tabs)/(home)/${homeId}/warranties`,
    addWarranty: (homeId: string) => `/(tabs)/(home)/${homeId}/warranties/add`,
    editWarranty: (homeId: string, warrantyId: string) => `/(tabs)/(home)/${homeId}/warranties/${warrantyId}/edit`,
    // Task routes within home
    tasks: (homeId: string) => `/(tabs)/(home)/${homeId}/tasks`,
    addTask: (homeId: string) => `/(tabs)/(home)/${homeId}/tasks/add`,
    taskSettings: (homeId: string) => `/(tabs)/(home)/${homeId}/tasks/settings`,
  },
  
  // Task routes - now home-specific
  tasks: {
    selector: '/(tabs)/(tasks)', // Home selector screen
    homeIndex: (homeId: string) => `/(tabs)/(home)/${homeId}/tasks`,
    add: (homeId: string) => `/(tabs)/(home)/${homeId}/tasks/add`,
    settings: (homeId: string) => `/(tabs)/(home)/${homeId}/tasks/settings`,
  },
  
  // Vendor routes
  vendors: {
    index: '/(tabs)/(vendors)',
    add: '/(tabs)/(vendors)/add',
    detail: (vendorId: string) => `/(tabs)/(vendors)/${vendorId}`,
    edit: (vendorId: string) => `/(tabs)/(vendors)/${vendorId}/edit`,
  },
  
  // Calendar routes
  calendar: {
    index: '/(tabs)/(calendar)',
    add: '/(tabs)/(calendar)/add',
    home: (homeId: string) => `/(tabs)/(home)/${homeId}/calendar`,
  },
  
  // Inventory routes
  inventory: {
    index: '/(tabs)/(dashboard)/inventory',
    add: '/(tabs)/(dashboard)/inventory/add',
    edit: (itemId: string) => `/(tabs)/(dashboard)/inventory/${itemId}/edit`,
  },
  
  // Settings routes
  settings: {
    index: '/(tabs)/(settings)',
    familyManagement: '/(tabs)/(settings)/family-management',
    inviteMembers: '/(tabs)/(settings)/invite-members',
  },
  
  // Profile routes
  profile: {
    index: '/(profile)',
    edit: '/(profile)/edit',
  },
  
  // Other routes
  invite: '/invite',
  notifications: '/(tabs)/(dashboard)/notifications',
  
  // Flo routes
  flo: {
    index: '/(tabs)/(flo)',
    chat: '/(tabs)/(flo)/chat',
  },
};

// Type-safe navigation helper with only current functionality
export const navigate = {
  // Auth routes
  toSignIn: () => router.push(routes.auth.signin as any),
  toSignUp: () => router.push(routes.auth.signup as any),
  toForgotPassword: () => router.push(routes.auth.forgotPassword as any),
  
  // Main tab routes
  toDashboard: () => router.replace(routes.tabs.dashboard as any),
  toHomes: () => router.replace(routes.tabs.homes as any),
  toTasks: () => router.replace(routes.tabs.tasks as any),
  toVendors: () => router.replace(routes.tabs.vendors as any),
  toFlo: () => router.replace(routes.tabs.flo as any),
  toSettings: () => router.replace(routes.tabs.settings as any),
  toCalendar: () => router.replace(routes.tabs.calendar as any),
  toCalendarHome: (homeId: string) => router.push(routes.calendar.home(homeId) as any),
  
  // Generic navigation
  back: () => router.back(),
  canGoBack: () => router.canGoBack(),
  replace: (route: string) => router.replace(route as any),
  push: (route: string) => router.push(route as any),
};

export default navigate; 