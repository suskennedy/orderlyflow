import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface BaseStackLayoutProps {
  children: React.ReactNode;
  headerShown?: boolean;
  animation?: 'slide_from_right' | 'fade' | 'flip' | 'none';
  backgroundColor?: string;
}

export default function BaseStackLayout({ 
  children, 
  headerShown = false, 
  animation = 'slide_from_right',
  backgroundColor 
}: BaseStackLayoutProps) {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true} 
      />
      <Stack
        screenOptions={{
          headerShown,
          contentStyle: {
            backgroundColor: backgroundColor || colors.background,
          },
          animation,
        }}
      >
        {children}
      </Stack>
    </>
  );
}
