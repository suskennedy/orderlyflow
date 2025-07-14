import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function AuthHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  onBackPress 
}: AuthHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showBackButton && onBackPress && (
        <View style={styles.backButtonContainer}>
          {/* Back button would go here if needed */}
        </View>
      )}
      
      <View style={styles.content}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="home" size={32} color={colors.primary} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});