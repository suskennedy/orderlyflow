import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../../lib/contexts/FamilyContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ThemeSwitcher from '../ui/ThemeSwitcher';

export default function SettingsScreen() {
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  const { familyAccount, userRole, createFamilyAccount, loading } = useFamily();
  const insets = useSafeAreaInsets();
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [familyName, setFamilyName] = useState('');

  const canManageFamily = userRole?.role === 'owner' || userRole?.role === 'admin';

  const handleCreateFamilyAccount = async () => {
    if (!familyName || familyName.trim() === '') {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }

    try {
      setIsCreatingFamily(true);
      await createFamilyAccount(familyName.trim());
      setFamilyName('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Family account created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create family account');
    } finally {
      setIsCreatingFamily(false);
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFamilyName('');
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderThemeSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      
      <View style={styles.themeContainer}>
        <View style={styles.themeInfo}>
          <Text style={[styles.themeLabel, { color: colors.text }]}>Theme</Text>
          <Text style={[styles.themeDescription, { color: colors.textTertiary }]}>
            Choose your preferred theme
          </Text>
        </View>
        <ThemeSwitcher size="medium" showLabel={true} />
      </View>

      <View style={styles.themeOptions}>
            <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: themeMode === 'light' ? colors.primaryLight : colors.surfaceVariant }
          ]}
          onPress={() => setThemeMode('light')}
        >
          <Ionicons 
            name="sunny" 
            size={20} 
            color={themeMode === 'light' ? colors.primary : colors.textTertiary} 
          />
          <Text style={[
            styles.themeOptionText,
            { color: themeMode === 'light' ? colors.primary : colors.textTertiary }
          ]}>
            Light
          </Text>
            </TouchableOpacity>

            <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: themeMode === 'dark' ? colors.primaryLight : colors.surfaceVariant }
          ]}
          onPress={() => setThemeMode('dark')}
        >
          <Ionicons 
            name="moon" 
            size={20} 
            color={themeMode === 'dark' ? colors.primary : colors.textTertiary} 
          />
          <Text style={[
            styles.themeOptionText,
            { color: themeMode === 'dark' ? colors.primary : colors.textTertiary }
          ]}>
            Dark
          </Text>
            </TouchableOpacity>

          <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: themeMode === 'system' ? colors.primaryLight : colors.surfaceVariant }
          ]}
          onPress={() => setThemeMode('system')}
        >
          <Ionicons 
            name="phone-portrait" 
            size={20} 
            color={themeMode === 'system' ? colors.primary : colors.textTertiary} 
          />
          <Text style={[
            styles.themeOptionText,
            { color: themeMode === 'system' ? colors.primary : colors.textTertiary }
          ]}>
            System
          </Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  const renderFamilySection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Management</Text>
      
      {familyAccount ? (
        <>
          <View style={styles.familyInfo}>
            <Text style={[styles.familyName, { color: colors.text }]}>{familyAccount.name}</Text>
            <Text style={[styles.familyRole, { color: colors.textSecondary }]}>
              Your role: {userRole?.role === 'owner' ? 'Owner' : userRole?.role === 'admin' ? 'Administrator' : 'Member'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/(settings)/family-management' as any)}
          >
            <Ionicons name="people-outline" size={20} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Manage Family Members</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
          
          {canManageFamily && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/(settings)/invite-members' as any)}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Invite New Members</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.noFamilyState}>
          <Ionicons name="people-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.noFamilyText, { color: colors.textSecondary }]}>
            No family account found
          </Text>
          <Text style={[styles.noFamilySubtext, { color: colors.textTertiary }]}>
            Create a family account to share your home management with family members
          </Text>
          
          <TouchableOpacity
            style={[
              styles.createFamilyButton,
              { 
                backgroundColor: isCreatingFamily ? colors.textSecondary : colors.primary,
                opacity: isCreatingFamily ? 0.6 : 1
              }
            ]}
            onPress={openCreateModal}
            disabled={isCreatingFamily || loading}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={20} 
              color={colors.background} 
            />
            <Text style={[styles.createFamilyButtonText, { color: colors.background }]}>
              {isCreatingFamily ? 'Creating...' : 'Create Family Account'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderNotificationsSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="notifications-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Push Notifications</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="mail-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Email Notifications</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="calendar-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Calendar Reminders</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="warning-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Task Due Date Alerts</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
            </View>
  );

  const renderBillingSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing & Subscription</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="card-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Payment Methods</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="receipt-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Billing History</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="star-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Upgrade Plan</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="business-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Tax Information</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
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
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="shield-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  const renderInfoSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>App Information</Text>
      
      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Current Theme</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{theme}</Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Theme Mode</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{themeMode}</Text>
      </View>

      <View style={styles.infoItem}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0</Text>
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
      >
        <View style={styles.content}>
          {renderThemeSection()}
          {renderFamilySection()}
          {renderNotificationsSection()}
          {renderBillingSection()}
          {renderSecuritySection()}
          {renderInfoSection()}
        </View>
      </ScrollView>

      {/* Create Family Account Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Family Account</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter a name for your family account
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border 
              }]}
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="e.g., Smith Family"
              placeholderTextColor={colors.textTertiary}
              autoFocus={true}
              autoCapitalize="words"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={closeCreateModal}
                disabled={isCreatingFamily}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.createButton, 
                  { 
                    backgroundColor: isCreatingFamily ? colors.textSecondary : colors.primary,
                    opacity: isCreatingFamily ? 0.6 : 1
                  }
                ]}
                onPress={handleCreateFamilyAccount}
                disabled={isCreatingFamily}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isCreatingFamily ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  familyInfo: {
    marginBottom: 16,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  familyRole: {
    fontSize: 14,
  },
  noFamilyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFamilyText: {
    fontSize: 16,
    marginTop: 8,
  },
  noFamilySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  createFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 20,
  },
  createFamilyButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
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
    gap: 8,
  },
  themeOptionText: {
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  createButton: {
    // backgroundColor is set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 