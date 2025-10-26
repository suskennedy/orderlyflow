import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';

export default function HouseholdManagementSection() {
  const { colors } = useTheme();
  const { signOut } = useAuth();

  const handleInviteUsers = () => {
    router.push('/(tabs)/(settings)/invite-members');
  };

  const handleManageSessions = () => {
    Alert.alert('Manage Sessions', 'This would show active sessions and allow logout from other devices');
  };

  const handleLogoutOtherDevices = () => {
    Alert.alert(
      'Logout Other Devices',
      'This will sign out all other devices except this one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout Others', 
          style: 'destructive',
          onPress: () => {
            // Handle logout other devices logic
            Alert.alert('Success', 'All other devices have been signed out');
          }
        }
      ]
    );
  };

  const handleFamilyManagement = () => {
    router.push('/(tabs)/(settings)/family-management');
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
        <Ionicons name="people-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Household Management</Text>
      </View>
      
      <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
        Invite your family or home manager to help keep things running smoothly
      </Text>

      <View style={styles.divider} />

      {renderActionItem(
        'person-add-outline',
        'Add / Invite Users',
        'Invite family members or home managers',
        handleInviteUsers
      )}

      {renderActionItem(
        'people-outline',
        'Manage Family & Permissions',
        'View and manage family members and their permissions',
        handleFamilyManagement
      )}

      {renderActionItem(
        'phone-portrait-outline',
        'Manage Sessions',
        'View active sessions and device information',
        handleManageSessions
      )}

      {renderActionItem(
        'log-out-outline',
        'Log Out of Other Devices',
        'Sign out all other devices except this one',
        handleLogoutOtherDevices,
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
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
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
