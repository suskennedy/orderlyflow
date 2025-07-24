import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function HomeLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            title: 'Home',
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
          name="flo"
          options={{
            title: 'Flo',
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconContainer, 
                focused && { backgroundColor: colors.primaryLight }
              ]}>
                <Ionicons 
                  name={focused ? "chatbubble" : "chatbubble-outline"} 
                  size={focused ? 26 : 24} 
                  color={color} 
                />
              </View>
            ),
          }}
        />
        
        {/* Hide other screens from the tab bar */}
        <Tabs.Screen name="add" options={{ href: null }} />
        <Tabs.Screen name="[homeId]" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
}); 