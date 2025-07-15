import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarProvider } from '../../lib/contexts/CalendarContext';
import { HomesProvider } from '../../lib/contexts/HomesContext';
import { InventoryProvider } from '../../lib/contexts/InventoryContext';
import { TasksProvider } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { VendorsProvider } from '../../lib/contexts/VendorsContext';
import { useAuth } from '../../lib/hooks/useAuth';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to sign in
      router.replace('/(auth)/signin');
    }
  }, [user, loading]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return <Redirect href="/signin" />;
  }

  return (
    <HomesProvider>
      <TasksProvider>
        <CalendarProvider>
          <VendorsProvider>
            <InventoryProvider>
              <Tabs
                screenOptions={{
                  tabBarActiveTintColor: colors.primary,
                  tabBarInactiveTintColor: colors.textTertiary,
                  tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
                    paddingTop: 12,
                    height: Platform.OS === 'ios' ? 85 + insets.bottom : 70,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 20,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: 'absolute',
                  },
                  tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                  },
                  tabBarIconStyle: {
                    marginTop: 4,
                  },
                  headerShown: false,
                  tabBarHideOnKeyboard: true,
                }}
              >
                <Tabs.Screen
                  name="index"
                  options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size, focused }) => (
                      <View style={[
                        styles.iconContainer, 
                        focused && { backgroundColor: colors.primaryLight }
                      ]}>
                        <Ionicons name={focused ? "grid" : "grid-outline"} size={focused ? 26 : 24} color={color} />
                      </View>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="homes/index"
                  options={{
                    title: 'Homes',
                    tabBarIcon: ({ color, size, focused }) => (
                      <View style={[
                        styles.iconContainer, 
                        focused && { backgroundColor: colors.primaryLight }
                      ]}>
                        <Ionicons name={focused ? "business" : "business-outline"} size={focused ? 26 : 24} color={color} />
                      </View>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="tasks/index"
                  options={{
                    title: 'Tasks',
                    tabBarIcon: ({ color, size, focused }) => (
                      <View style={[
                        styles.iconContainer, 
                        focused && { backgroundColor: colors.primaryLight }
                      ]}>
                        <Ionicons name={focused ? "checkbox" : "checkbox-outline"} size={focused ? 26 : 24} color={color} />
                      </View>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="calendar"
                  options={{
                    title: 'Calendar',
                    tabBarIcon: ({ color, size, focused }) => (
                      <View style={[
                        styles.iconContainer, 
                        focused && { backgroundColor: colors.primaryLight }
                      ]}>
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={focused ? 26 : 24} color={color} />
                      </View>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="vendors/index"
                  options={{
                    title: 'Vendors',
                    tabBarIcon: ({ color, size, focused }) => (
                      <View style={[
                        styles.iconContainer, 
                        focused && { backgroundColor: colors.primaryLight }
                      ]}>
                        <Ionicons name={focused ? "people" : "people-outline"} size={focused ? 26 : 24} color={color} />
                      </View>
                    ),
                  }}
                />
                <Tabs.Screen
                  name="inventory/index"
                  options={{
                    title: 'Inventory',
                    tabBarIcon: ({ color, size, focused }) => (
                      <View style={[
                        styles.iconContainer, 
                        focused && { backgroundColor: colors.primaryLight }
                      ]}>
                        <Ionicons name={focused ? "cube" : "cube-outline"} size={focused ? 26 : 24} color={color} />
                      </View>
                    ),
                  }}
                />
                  <Tabs.Screen
                    name="settings/index"
                    options={{
                      title: 'Settings',
                      tabBarIcon: ({ color, size, focused }) => (
                        <View style={[
                          styles.iconContainer, 
                          focused && { backgroundColor: colors.primaryLight }
                        ]}>
                          <Ionicons name={focused ? "settings" : "settings-outline"} size={focused ? 26 : 24} color={color} />
                        </View>
                      ),
                    }}
                  />

                {/* Hide add routes from tab bar */}
                <Tabs.Screen name="homes/add" options={{ href: null }} />
                <Tabs.Screen name="tasks/add" options={{ href: null }} />
                <Tabs.Screen name="vendors/add" options={{ href: null }} />
                <Tabs.Screen name="inventory/add" options={{ href: null }} />
                <Tabs.Screen name="calendar/add" options={{ href: null }} />
                
                {/* Hide profile and notifications from tab bar */}
                <Tabs.Screen name="profile/index" options={{ href: null }} />
                <Tabs.Screen name="notifications/index" options={{ href: null }} />
              </Tabs>
            </InventoryProvider>
          </VendorsProvider>
        </CalendarProvider>
      </TasksProvider>
    </HomesProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
}); 