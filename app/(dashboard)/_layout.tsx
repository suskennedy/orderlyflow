import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/signin');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/signin" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.primary,
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
          title: 'Hubs',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "grid" : "grid-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Homes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "list" : "list-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "people" : "people-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "calendar" : "calendar-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
          href: '/(profile)',
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer, 
              focused && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons 
                name={focused ? "settings" : "settings-outline"} 
                size={focused ? 26 : 24} 
                color={color} 
              />
            </View>
          ),
          href: '/(settings)',
        }}
      />
      <Tabs.Screen name="info" options={{ href: null }} />
      <Tabs.Screen name="tasks/add" options={{ href: null }} />
    </Tabs>
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