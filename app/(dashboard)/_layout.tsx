import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useAuth } from '../../lib/hooks/useAuth';

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to sign in
      router.replace('/(auth)/signin');
    }
  }, [user, loading]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 90 : 75,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: 'transparent',
          borderBottomWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: '#1E293B',
        },
        tabBarItemStyle: {
          borderRadius: 12,
          marginHorizontal: 4,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons 
                name={focused ? "grid" : "grid-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="homes/index"
        options={{
          title: 'Homes',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons 
                name={focused ? "business" : "business-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons 
                name={focused ? "checkbox" : "checkbox-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="vendors/index"
        options={{
          title: 'Vendors',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons 
                name={focused ? "people" : "people-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons 
                name={focused ? "cube" : "cube-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          )
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Ionicons 
                name={focused ? "settings" : "settings-outline"} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      
      {/* Hide all add routes from tab bar */}
      <Tabs.Screen
        name="homes/add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tasks/add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="vendors/add"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="inventory/add"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  tabBarBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    transform: [{ scale: 1.1 }],
  },
}); 