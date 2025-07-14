import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Interactive colors
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special colors
  shadow: string;
  overlay: string;
  divider: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  // Background colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  
  // Text colors
  text: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6B7280',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Interactive colors
  primary: '#4F46E5',
  primaryLight: '#DBEAFE',
  secondary: '#059669',
  accent: '#DC2626',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  
  // Special colors
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  divider: '#E5E7EB',
};

const darkColors: ThemeColors = {
  // Background colors
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  surfaceElevated: '#334155',
  
  // Text colors
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
  
  // Border colors
  border: '#334155',
  borderLight: '#475569',
  
  // Interactive colors
  primary: '#6366F1',
  primaryLight: '#3730A3',
  secondary: '#10B981',
  accent: '#EF4444',
  
  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Special colors
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  divider: '#334155',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load saved theme mode from storage
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode) {
          setThemeMode(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };
    
    loadThemeMode();
  }, []);

  // Update theme based on mode and system preference
  useEffect(() => {
    let newTheme: 'light' | 'dark';
    
    switch (themeMode) {
      case 'light':
        newTheme = 'light';
        break;
      case 'dark':
        newTheme = 'dark';
        break;
      case 'system':
      default:
        newTheme = systemColorScheme || 'light';
        break;
    }
    
    setTheme(newTheme);
  }, [themeMode, systemColorScheme]);

  // Save theme mode to storage
  const saveThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    saveThemeMode(newMode);
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemeMode(mode);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  const isDark = theme === 'dark';

  const value: ThemeContextType = {
    theme,
    themeMode,
    colors,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 