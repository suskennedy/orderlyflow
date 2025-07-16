import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface ProfileData {
  full_name: string | null;
  display_name: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Loading profile data for user:', user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('Profile data loaded:', data);
        setProfileData({
          full_name: data.full_name,
          display_name: data.display_name,
          bio: data.bio,
          phone: data.phone,
          avatar_url: data.avatar_url,
        });
      } else {
        console.log('No profile data found, using defaults');
        setProfileData({
          full_name: null,
          display_name: null,
          bio: null,
          phone: null,
          avatar_url: null,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const renderHeader = () => (
    <View style={[styles.header, { 
      backgroundColor: colors.surface,
      borderBottomColor: colors.border 
    }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderProfileInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Full Name</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>
          {profileData?.full_name || 'Not set'}
        </Text>
      </View>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Display Name</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>
          {profileData?.display_name || 'Not set'}
        </Text>
      </View>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
      </View>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>
          {profileData?.phone || 'Not set'}
        </Text>
      </View>
      
      {profileData?.bio && (
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Bio</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {profileData.bio}
          </Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(dashboard)/profile/edit')}>
        <Ionicons name="create-outline" size={16} color={colors.primary} />
        <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBillingSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing & Subscription</Text>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Plan</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>Free Plan</Text>
      </View>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Next Billing</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>N/A</Text>
      </View>
      
      <TouchableOpacity style={styles.upgradeButton}>
        <Ionicons name="star-outline" size={16} color={colors.warning} />
        <Text style={[styles.upgradeButtonText, { color: colors.warning }]}>Upgrade Plan</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSecuritySection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Change Password</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Two-Factor Authentication</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="key-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>API Keys</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  const renderAccountSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="people-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Team Members</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="download-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Export Data</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.menuItem, styles.dangerItem]}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
        <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Account</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderSignOutButton = () => (
    <TouchableOpacity 
      style={[styles.signOutButton, { backgroundColor: colors.error }]}
      onPress={signOut}
    >
      <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
      <Text style={[styles.signOutButtonText, { color: colors.textInverse }]}>Sign Out</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 80 // Add extra padding for tab bar
    }]}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading profile...</Text>
            </View>
          ) : (
            <>
              {renderProfileInfo()}
              {renderBillingSection()}
              {renderSecuritySection()}
              {renderAccountSection()}
              {renderSignOutButton()}
            </>
          )}
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
  scrollView: {
    flex: 1,
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  dangerItem: {
    borderBottomColor: 'rgba(220,38,38,0.2)',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 