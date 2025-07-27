import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push('/(profile)/edit')}
      >
        <Ionicons name="create-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderProfileSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.user_metadata?.full_name || 'User Name'}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
      
      <View style={styles.infoItem}>
        <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Full Name</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.user_metadata?.full_name || 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.email || 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.user_metadata?.phone || 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.user_metadata?.location || 'Not set'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAccountInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
      
      <View style={styles.infoItem}>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member Since</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Account Status</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.email_confirmed_at ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Sign In</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
      
      <TouchableOpacity 
        style={styles.actionItem}
        onPress={() => router.push('/(profile)/edit')}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={[styles.actionText, { color: colors.text }]}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionItem}
        onPress={() => router.push('/(settings)')}
      >
        <Ionicons name="settings-outline" size={20} color={colors.primary} />
        <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionItem}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.actionText, { color: colors.error }]}>Sign Out</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingTop: insets.top,
    }]}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderProfileSection()}
          {renderPersonalInfo()}
          {renderAccountInfo()}
          {renderActions()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
}); 