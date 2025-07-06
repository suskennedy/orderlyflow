import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  showBackButton?: boolean;
  backRoute?: string;
}

export default function AuthHeader({
  title,
  subtitle,
  iconName = "home",
  showBackButton = false,
  backRoute,
}: AuthHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (backRoute) {
      router.replace(backRoute as RelativePathString);
    } else if (showBackButton) {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      {/* Top navigation bar with back button and centered app logo */}
      <View style={styles.navBar}>
        {/* Left side - Back button or empty space */}
        <View style={styles.navLeft}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              accessibilityLabel="Go back"
            >
              <View style={styles.backButtonInner}>
                <Ionicons name="arrow-back" size={22} color="#4F46E5" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Logo and app name */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name={iconName} size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>OrderlyFlow</Text>
        </View>

        {/* Right side - Empty space to balance the layout */}
        <View style={styles.navRight}>
          {/* This empty View helps with centering by balancing the back button */}
          {showBackButton && <View style={styles.placeholder} />}
        </View>
      </View>
      
      {/* Header content with title and subtitle */}
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    marginBottom: 32,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  navLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  navRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {},
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});