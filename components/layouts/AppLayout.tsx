import React, { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import FooterNavigation from '../navigation/FooterNavigation';

interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  paddingBottom?: number;
}

export default function AppLayout({ 
  children, 
  showFooter = true, 
  paddingBottom = 0 
}: AppLayoutProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const footerHeight = Platform.OS === 'ios' ? 65 + insets.bottom : 55;
  const bottomPadding = showFooter ? footerHeight + paddingBottom : paddingBottom;

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.background,
        paddingBottom: bottomPadding
      }
    ]}>
      {/* Main Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Footer Navigation */}
      <FooterNavigation showFooter={showFooter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
}); 