import { Stack } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CalendarProvider } from '../lib/contexts/CalendarContext';
import { HomesProvider } from '../lib/contexts/HomesContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Make status bar transparent to avoid overlapping issues */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      {/* Use SafeAreaView with edges prop to handle both top and bottom system UI elements */}
      <SafeAreaView 
        style={{ flex: 1 }} 
        edges={['top', 'bottom', 'left', 'right']}
      >
        <HomesProvider>
          <CalendarProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: "#F8FAFC",
                  ...(Platform.OS === 'android' && { 
                    paddingBottom: 0 
                  })
                },
                animation: "slide_from_right",
                // Add additional padding for Android navigation bar if needed
              }}
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(auth)"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="(dashboard)"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
            </Stack>
          </CalendarProvider>
        </HomesProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}