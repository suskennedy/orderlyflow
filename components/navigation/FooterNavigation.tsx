import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface FooterNavigationProps {
  showFooter?: boolean;
}

export default function FooterNavigation({ showFooter = true }: FooterNavigationProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  if (!showFooter) return null;

  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  const handleNavigation = (path: string) => {
    if (!isActive(path)) {
      router.push(path as any);
    }
  };

  const navigationItems = [
    {
      key: 'dashboard',
      title: 'Dash',
      path: '/(tabs)/(dashboard)',
      icon: {
        active: 'grid',
        inactive: 'grid-outline'
      }
    },
    {
      key: 'homes',
      title: 'Homes',
      path: '/(tabs)/(home)',
      icon: {
        active: 'home',
        inactive: 'home-outline'
      }
    },
    {
      key: 'tasks',
      title: 'Tasks',
      path: '/(tabs)/(tasks)',
      icon: {
        active: 'list',
        inactive: 'list-outline'
      }
    },
    {
      key: 'vendors',
      title: 'Vendors',
      path: '/(tabs)/(vendors)',
      icon: {
        active: 'people',
        inactive: 'people-outline'
      }
    },
    {
      key: 'flo',
      title: 'Flo',
      path: '/(tabs)/(flo)',
      icon: {
        active: 'chatbubble',
        inactive: 'chatbubble-outline'
      }
    }
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.primary,
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
      }
    ]}>
      {navigationItems.map((item) => {
        const active = isActive(item.path);
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tabItem}
            onPress={() => handleNavigation(item.path)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              active && { backgroundColor: colors.primaryLight }
            ]}>
              <Ionicons
                name={(active ? item.icon.active : item.icon.inactive) as any}
                size={active ? 26 : 24}
                color={active ? colors.text : colors.textSecondary}
              />
            </View>
            <View style={styles.labelContainer}>
              <View style={[
                styles.activeIndicator,
                { backgroundColor: active ? colors.text : 'transparent' }
              ]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  labelContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
}); 