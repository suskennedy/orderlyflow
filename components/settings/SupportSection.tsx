import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';

export default function SupportSection() {
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const handleReportBug = () => {
    router.push('/(tabs)/(settings)/report-bug');
  };

  const handleContactSupport = () => {
    router.push('/(tabs)/(settings)/contact-support');
  };

  const handleSuggestFeature = () => {
    router.push('/(tabs)/(settings)/feedback');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const renderActionItem = (
    icon: string,
    label: string,
    description: string,
    onPress: () => void,
    isDestructive = false
  ) => (
    <TouchableOpacity 
      style={styles.actionItem}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: isDestructive ? colors.error + '15' : colors.primaryLight }]}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={isDestructive ? colors.error : colors.primary} 
        />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Support</Text>
      </View>

      {renderActionItem(
        'bug-outline',
        'Report a Bug',
        'Found an issue? Let us know so we can fix it',
        handleReportBug
      )}

      {renderActionItem(
        'chatbubble-outline',
        'Contact Support',
        'Get help from our support team',
        handleContactSupport
      )}

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <Ionicons name="bulb-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Feedback</Text>
      </View>

      {renderActionItem(
        ' ',
        'Suggest a Feature',
        'Have an idea? We\'d love to hear it',
        handleSuggestFeature
      )}

      <View style={styles.divider} />

      {renderActionItem(
        'log-out-outline',
        'Sign Out',
        'Sign out of your account',
        handleSignOut,
        true
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
  },
});
