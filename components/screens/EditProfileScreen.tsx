import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  
  // Form refs for focus management
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    location: user?.user_metadata?.location || '',
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputFocus = (field: string) => {
    setFocusedField(field);
  };

  const handleInputBlur = () => {
    setFocusedField(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
        }
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Refresh user data to get updated metadata
      await refreshUser();
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={[styles.saveButtonText, { color: colors.primary }]}>
          {loading ? 'Saving...' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Information</Text>
      
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.text }]}>
            {formData.full_name || 'User Name'}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
      
      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
        <TextInput
          ref={nameRef}
          style={[
            styles.input,
            { 
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: focusedField === 'full_name' ? colors.primary : colors.border
            }
          ]}
          value={formData.full_name}
          onChangeText={(value) => handleInputChange('full_name', value)}
          onFocus={() => handleInputFocus('full_name')}
          onBlur={handleInputBlur}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
      </View>

      {/* Phone */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
        <TextInput
          ref={phoneRef}
          style={[
            styles.input,
            { 
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: focusedField === 'phone' ? colors.primary : colors.border
            }
          ]}
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          onFocus={() => handleInputFocus('phone')}
          onBlur={handleInputBlur}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          returnKeyType="next"
          onSubmitEditing={() => locationRef.current?.focus()}
        />
      </View>

      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>Location</Text>
        <TextInput
          ref={locationRef}
          style={[
            styles.input,
            { 
              backgroundColor: colors.surfaceVariant,
              color: colors.text,
              borderColor: focusedField === 'location' ? colors.primary : colors.border
            }
          ]}
          value={formData.location}
          onChangeText={(value) => handleInputChange('location', value)}
          onFocus={() => handleInputFocus('location')}
          onBlur={handleInputBlur}
          placeholder="Enter your location"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
        />
      </View>
    </View>
  );

  const renderAccountInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
      
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
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { 
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }]}
    >
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {renderProfileSection()}
          {renderForm()}
          {renderAccountInfo()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
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
}); 