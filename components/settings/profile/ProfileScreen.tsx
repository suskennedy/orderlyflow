import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useFamilyStore } from '../../../lib/stores/familyStore';
import { supabase } from '../../../lib/supabase';
import { ProfileSkeleton } from '../../ui/ProfileSkeleton';

interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  family_account_id: string | null;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors } = useTheme();
  const familyMembers = useFamilyStore(state => state.familyMembers);
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Refresh profile data when screen comes into focus (e.g., returning from edit screen)
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  const getAvatarUrl = () => {
    if (userProfile?.avatar_url) {
      return `${supabase.storage.from('profiles').getPublicUrl(`avatar/${userProfile.avatar_url}`).data.publicUrl}`;
    }
    return null;
  };

  const getSubscriptionStatus = () => {
    // This would be determined by your subscription logic
    return {
      plan: 'Free', // or 'Premium', 'Pro', etc.
      status: 'active', // or 'expired'
      memberSince: userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'
    };
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
        onPress={() => router.push({
          pathname: '/(profile)/edit',
          params: { userProfile: JSON.stringify(userProfile) }
        })}
      >
        <Ionicons name="create-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderProfileSection = () => {
    const avatarUrl = getAvatarUrl();
    
    return (
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push({
            pathname: '/(profile)/edit',
            params: { userProfile: JSON.stringify(userProfile) }
          })}
        >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={colors.primary} />
            )}
            <View style={[styles.editAvatarOverlay, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              {userProfile?.display_name || userProfile?.full_name || 'User Name'}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              {userProfile?.email || user?.email || 'user@example.com'}
            </Text>
            {userProfile?.bio && (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>
                {userProfile.bio}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPersonalInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Information</Text>
      
      <View style={styles.infoItem}>
        <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {userProfile?.display_name || userProfile?.full_name || 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {userProfile?.email || user?.email || 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone Number</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {userProfile?.phone || 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.infoItem}>
        <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
        <View style={styles.infoContent}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>
            {userProfile?.bio || 'Not set'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAccountInfo = () => {
    const subscription = getSubscriptionStatus();
    
    return (
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member Since</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {subscription.memberSince}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Subscription Plan</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {subscription.plan}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color={subscription.status === 'active' ? colors.success : colors.error} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status</Text>
            <Text style={[styles.infoValue, { color: subscription.status === 'active' ? colors.success : colors.error }]}>
              {subscription.status === 'active' ? 'Active' : 'Expired'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(profile)/subscription')}
        >
          <Ionicons name="settings-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Manage Subscription</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoItem}
          onPress={() => router.push('/(settings)')}
        >
          <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>People Connected</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {familyMembers?.length || 0} members
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderActions = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <TouchableOpacity 
        style={styles.actionItem}
        onPress={handleSignOut}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Ionicons name="log-out-outline" size={16} color={colors.error} />
        </View>
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
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
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
        </>
      )}
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
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  bio: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
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
  sectionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 