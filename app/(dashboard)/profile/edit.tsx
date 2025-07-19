import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface ProfileData {
  full_name: string;
  display_name: string;
  bio: string;
  phone: string;
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  theme: 'light' | 'dark' | 'system';
  calendar_sync_google: boolean;
  calendar_sync_apple: boolean;
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    display_name: '',
    bio: '',
    phone: '',
    notification_email: true,
    notification_push: false,
    notification_sms: false,
    theme: 'system',
    calendar_sync_google: false,
    calendar_sync_apple: false,
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('Loading profile for user:', user.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id!)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No existing profile found, will create new one');
          // Profile doesn't exist yet, that's okay
          return;
        }
        console.error('Error loading profile:', error);
        Alert.alert('Error', `Failed to load profile: ${error.message}`);
        return;
      }

      console.log('Profile data loaded:', data);

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          phone: data.phone || '',
          notification_email: data.notification_email ?? true,
          notification_push: data.notification_push ?? false,
          notification_sms: data.notification_sms ?? false,
          theme: (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system') ? data.theme : 'system',
          calendar_sync_google: data.calendar_sync_google ?? false,
          calendar_sync_apple: data.calendar_sync_apple ?? false,
        });
        setAvatarUrl(data.avatar_url);
        console.log('Profile data set:', profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to load profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user?.id) return;

    try {
      setUploadingAvatar(true);
      console.log('Uploading avatar:', uri);

      const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;
      
      // Simple fetch and upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', uploadError.message);
        return;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setAvatarUrl(urlData.publicUrl);

      // Update profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        Alert.alert('Error', 'Failed to save avatar URL to profile');
        return;
      }

      Alert.alert('Success', 'Avatar uploaded successfully!');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      console.log('Saving profile data:', profileData);

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          display_name: profileData.display_name,
          bio: profileData.bio,
          phone: profileData.phone,
          notification_email: profileData.notification_email,
          notification_push: profileData.notification_push,
          notification_sms: profileData.notification_sms,
          theme: profileData.theme,
          calendar_sync_google: profileData.calendar_sync_google,
          calendar_sync_apple: profileData.calendar_sync_apple,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id' // Specify conflict resolution
        });

      if (error) {
        console.error('Profile save error:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save profile: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

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
      <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={saveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderAvatarSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Picture</Text>
      
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : ( 
            <Ionicons name="person" size={40} color={colors.textTertiary} />
          )}
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.avatarActions}>
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: colors.primary }]}
            onPress={pickImage}
            disabled={uploadingAvatar}
          >
            <Ionicons name="image-outline" size={16} color={colors.textInverse} />
            <Text style={[styles.avatarButtonText, { color: colors.textInverse }]}>Gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: colors.secondary }]}
            onPress={takePhoto}
            disabled={uploadingAvatar}
          >
            <Ionicons name="camera-outline" size={16} color={colors.textInverse} />
            <Text style={[styles.avatarButtonText, { color: colors.textInverse }]}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPersonalInfoSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={profileData.full_name}
          onChangeText={(text) => setProfileData({ ...profileData, full_name: text })}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Display Name</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={profileData.display_name}
          onChangeText={(text) => setProfileData({ ...profileData, display_name: text })}
          placeholder="Enter your display name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={profileData.phone}
          onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bio</Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={profileData.bio}
          onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
          placeholder="Tell us about yourself"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderNotificationSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
      
      <View style={styles.switchItem}>
        <View style={styles.switchInfo}>
          <Ionicons name="mail-outline" size={20} color={colors.text} />
          <Text style={[styles.switchLabel, { color: colors.text }]}>Email Notifications</Text>
        </View>
        <Switch
          value={profileData.notification_email}
          onValueChange={(value) => setProfileData({ ...profileData, notification_email: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryLight }}
          thumbColor={profileData.notification_email ? colors.primary : colors.textTertiary}
        />
      </View>

      <View style={styles.switchItem}>
        <View style={styles.switchInfo}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <Text style={[styles.switchLabel, { color: colors.text }]}>Push Notifications</Text>
        </View>
        <Switch
          value={profileData.notification_push}
          onValueChange={(value) => setProfileData({ ...profileData, notification_push: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryLight }}
          thumbColor={profileData.notification_push ? colors.primary : colors.textTertiary}
        />
      </View>

      <View style={styles.switchItem}>
        <View style={styles.switchInfo}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={[styles.switchLabel, { color: colors.text }]}>SMS Notifications</Text>
        </View>
        <Switch
          value={profileData.notification_sms}
          onValueChange={(value) => setProfileData({ ...profileData, notification_sms: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryLight }}
          thumbColor={profileData.notification_sms ? colors.primary : colors.textTertiary}
        />
      </View>
    </View>
  );

  const renderThemeSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      
      <View style={styles.themeOptions}>
        {(['light', 'dark', 'system'] as const).map((theme) => (
          <TouchableOpacity
            key={theme}
            style={[
              styles.themeOption,
              { 
                backgroundColor: profileData.theme === theme ? colors.primaryLight : colors.surfaceVariant,
                borderColor: profileData.theme === theme ? colors.primary : colors.border
              }
            ]}
            onPress={() => setProfileData({ ...profileData, theme })}
          >
            <Ionicons 
              name={theme === 'light' ? 'sunny' : theme === 'dark' ? 'moon' : 'phone-portrait'} 
              size={20} 
              color={profileData.theme === theme ? colors.primary : colors.textTertiary} 
            />
            <Text style={[
              styles.themeOptionText,
              { color: profileData.theme === theme ? colors.primary : colors.textTertiary }
            ]}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCalendarSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Calendar Sync</Text>
      
      <View style={styles.switchItem}>
        <View style={styles.switchInfo}>
          <Ionicons name="logo-google" size={20} color={colors.text} />
          <Text style={[styles.switchLabel, { color: colors.text }]}>Google Calendar</Text>
        </View>
        <Switch
          value={profileData.calendar_sync_google}
          onValueChange={(value) => setProfileData({ ...profileData, calendar_sync_google: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryLight }}
          thumbColor={profileData.calendar_sync_google ? colors.primary : colors.textTertiary}
        />
      </View>

      <View style={styles.switchItem}>
        <View style={styles.switchInfo}>
          <Ionicons name="logo-apple" size={20} color={colors.text} />
          <Text style={[styles.switchLabel, { color: colors.text }]}>Apple Calendar</Text>
        </View>
        <Switch
          value={profileData.calendar_sync_apple}
          onValueChange={(value) => setProfileData({ ...profileData, calendar_sync_apple: value })}
          trackColor={{ false: colors.surfaceVariant, true: colors.primaryLight }}
          thumbColor={profileData.calendar_sync_apple ? colors.primary : colors.textTertiary}
        />
      </View>
    </View>
  );

  const renderDebugSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Debug Tools</Text>
      
      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: colors.accent }]}
        onPress={async () => {
          try {
            console.log('Testing comprehensive storage access...');
            
            // Test 1: Check if bucket exists
            const { data: bucketData, error: bucketError } = await supabase.storage
              .from('profiles')
              .list('', { limit: 1 });
            
            if (bucketError) {
              console.error('Bucket access error:', bucketError);
              Alert.alert('Bucket Error', `Cannot access profiles bucket: ${bucketError.message}`);
              return;
            }
            
            console.log('Bucket accessible:', bucketData);
            
            // Test 2: Check if avatars folder exists
            const { data: folderData, error: folderError } = await supabase.storage
              .from('profiles')
              .list('avatars', { limit: 1 });
            
            if (folderError) {
              console.error('Folder access error:', folderError);
              Alert.alert('Folder Error', `Cannot access avatars folder: ${folderError.message}`);
              return;
            }
            
            console.log('Avatars folder accessible:', folderData);
            
            // Test 3: Try to upload a small test file
            const testBlob = new Blob(['test'], { type: 'text/plain' });
            const testFileName = `test-${Date.now()}.txt`;
            const testPath = `avatars/${testFileName}`;
            
            console.log('Attempting test upload:', testPath);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('profiles')
              .upload(testPath, testBlob, {
                contentType: 'text/plain',
                upsert: true,
              });
            
            if (uploadError) {
              console.error('Test upload error:', uploadError);
              Alert.alert('Upload Error', `Cannot upload to avatars folder: ${uploadError.message}`);
              return;
            }
            
            console.log('Test upload successful:', uploadData);
            
            // Clean up test file
            await supabase.storage
              .from('profiles')
              .remove([testPath]);
            
            Alert.alert('Success', 'Storage is properly configured! All tests passed.');
            
          } catch (error) {
            console.error('Comprehensive storage test error:', error);
            Alert.alert('Error', 'Failed to test storage configuration');
          }
        }}
      >
        <Text style={[styles.debugButtonText, { color: colors.textInverse }]}>Test Storage Configuration</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: colors.info }]}
        onPress={async () => {
          try {
            console.log('Testing Supabase configuration...');
            
            // Test database connection
            const { data: dbData, error: dbError } = await supabase
              .from('user_profiles')
              .select('count')
              .limit(1);
            
            if (dbError) {
              console.error('Database connection error:', dbError);
              Alert.alert('Database Error', `Cannot connect to database: ${dbError.message}`);
              return;
            }
            
            console.log('Database connection successful:', dbData);
            
            // Test storage connection
            const { data: storageData, error: storageError } = await supabase.storage
              .from('profiles')
              .list('', { limit: 1 });
            
            if (storageError) {
              console.error('Storage connection error:', storageError);
              Alert.alert('Storage Error', `Cannot connect to storage: ${storageError.message}`);
              return;
            }
            
            console.log('Storage connection successful:', storageData);
            
            // Get current user info
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (!currentUser) {
              Alert.alert('Auth Error', 'User not authenticated');
              return;
            }
            
            console.log('User authenticated:', currentUser.id);
            
            Alert.alert('Success', 'Supabase configuration is working correctly!\n\nUser ID: ' + currentUser.id);
            
          } catch (error) {
            console.error('Configuration test error:', error);
            Alert.alert('Error', 'Failed to test Supabase configuration');
          }
        }}
      >
        <Text style={[styles.debugButtonText, { color: colors.textInverse }]}>Test Supabase Config</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: colors.secondary }]}
        onPress={async () => {
          if (!user?.id) {
            Alert.alert('Error', 'User ID not available');
            return;
          }
          
          try {
            console.log('Checking current profile...');
            const { data, error } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (error) {
              console.error('Profile check error:', error);
              Alert.alert('Profile Check', `Error: ${error.message}`);
            } else {
              console.log('Current profile:', data);
              Alert.alert('Profile Data', `Found profile: ${JSON.stringify(data, null, 2)}`);
            }
          } catch (error) {
            console.error('Profile check error:', error);
            Alert.alert('Error', 'Failed to check profile');
          }
        }}
      >
        <Text style={[styles.debugButtonText, { color: colors.textInverse }]}>Check Current Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.debugButton, { backgroundColor: colors.error }]}
        onPress={async () => {
          try {
            console.log('Testing avatars folder in profiles bucket...');
            const { data, error } = await supabase.storage
              .from('profiles')
              .list('avatars', { limit: 1 });
            
            if (error) {
              console.error('Avatars folder error:', error);
              Alert.alert(
                'Storage Setup Required', 
                'The "avatars" folder does not exist in the profiles bucket. Please:\n\n1. Go to Supabase Dashboard\n2. Navigate to Storage → profiles bucket\n3. Create a folder named "avatars"\n4. Set up RLS policies for the avatars folder',
                [{ text: 'OK' }]
              );
            } else {
              console.log('Avatars folder accessible:', data);
              Alert.alert('Success', 'Avatars folder exists and is accessible!');
            }
          } catch (error) {
            console.error('Avatars folder test error:', error);
            Alert.alert('Error', 'Failed to test avatars folder');
          }
        }}
      >
        <Text style={[styles.debugButtonText, { color: colors.textInverse }]}>Test Avatars Folder</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + 80
    }]}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderAvatarSection()}
          {renderPersonalInfoSection()}
          {renderNotificationSection()}
          {renderThemeSection()}
          {renderCalendarSection()}
          {renderDebugSection()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
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
  avatarContainer: {
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  avatarButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  debugButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  debugButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 