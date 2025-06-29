import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signOut } from '../../../lib/auth/actions';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  theme: string | null;
  notification_email: boolean | null;
  notification_push: boolean | null;
  notification_sms: boolean | null;
  calendar_sync_google: boolean | null;
  calendar_sync_apple: boolean | null;
  default_home_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function SettingsScreen() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    bio: '',
    phone: '',
    notification_email: true,
    notification_push: true,
    notification_sms: false,
    calendar_sync_google: false,
    calendar_sync_apple: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          phone: data.phone || '',
          notification_email: data.notification_email ?? true,
          notification_push: data.notification_push ?? true,
          notification_sms: data.notification_sms ?? false,
          calendar_sync_google: data.calendar_sync_google ?? false,
          calendar_sync_apple: data.calendar_sync_apple ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const profileData = {
        id: user?.id,
        full_name: formData.full_name || null,
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        phone: formData.phone || null,
        notification_email: formData.notification_email,
        notification_push: formData.notification_push,
        notification_sms: formData.notification_sms,
        calendar_sync_google: formData.calendar_sync_google,
        calendar_sync_apple: formData.calendar_sync_apple,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (error) throw error;

      setProfile(profileData as UserProfile);
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {editMode ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditMode(false);
                // Reset form data
                if (profile) {
                  setFormData({
                    full_name: profile.full_name || '',
                    display_name: profile.display_name || '',
                    bio: profile.bio || '',
                    phone: profile.phone || '',
                    notification_email: profile.notification_email ?? true,
                    notification_push: profile.notification_push ?? true,
                    notification_sms: profile.notification_sms ?? false,
                    calendar_sync_google: profile.calendar_sync_google ?? false,
                    calendar_sync_apple: profile.calendar_sync_apple ?? false,
                  });
                }
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create-outline" size={20} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#6B7280" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userJoined}>
                Member since {new Date(user?.created_at || '').toLocaleDateString()}
              </Text>
            </View>
          </View>

          {editMode ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Display name"
                value={formData.display_name}
                onChangeText={(text) => setFormData({ ...formData, display_name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Bio"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          ) : (
            <View style={styles.profileDetails}>
              {profile?.full_name && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{profile.full_name}</Text>
                </View>
              )}
              {profile?.display_name && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Display Name</Text>
                  <Text style={styles.detailValue}>{profile.display_name}</Text>
                </View>
              )}
              {profile?.phone && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{profile.phone}</Text>
                </View>
              )}
              {profile?.bio && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bio</Text>
                  <Text style={styles.detailValue}>{profile.bio}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive updates via email</Text>
            </View>
            <Switch
              value={formData.notification_email}
              onValueChange={(value) => {
                setFormData({ ...formData, notification_email: value });
                if (!editMode) {
                  setEditMode(true);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications</Text>
            </View>
            <Switch
              value={formData.notification_push}
              onValueChange={(value) => {
                setFormData({ ...formData, notification_push: value });
                if (!editMode) {
                  setEditMode(true);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>SMS Notifications</Text>
              <Text style={styles.settingDescription}>Receive text messages</Text>
            </View>
            <Switch
              value={formData.notification_sms}
              onValueChange={(value) => {
                setFormData({ ...formData, notification_sms: value });
                if (!editMode) {
                  setEditMode(true);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calendar Sync</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Google Calendar</Text>
              <Text style={styles.settingDescription}>Sync with Google Calendar</Text>
            </View>
            <Switch
              value={formData.calendar_sync_google}
              onValueChange={(value) => {
                setFormData({ ...formData, calendar_sync_google: value });
                if (!editMode) {
                  setEditMode(true);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Apple Calendar</Text>
              <Text style={styles.settingDescription}>Sync with Apple Calendar</Text>
            </View>
            <Switch
              value={formData.calendar_sync_apple}
              onValueChange={(value) => {
                setFormData({ ...formData, calendar_sync_apple: value });
                if (!editMode) {
                  setEditMode(true);
                }
              }}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userJoined: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  profileDetails: {
    gap: 12,
  },
  detailItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
}); 