import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ThemeSwitcher from '../ui/ThemeSwitcher';    

export default function SettingsScreen() {
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

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

  const renderUsersSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Users & Team</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="people-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Team Members</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="person-add-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Invite Users</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="settings-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>User Permissions</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="log-out-outline" size={20} color={colors.text} />
        <Text style={[styles.menuItemText, { color: colors.text }]}>Manage Sessions</Text>
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
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom
    }]}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderThemeSection()}
          {renderNotificationsSection()}
          {renderBillingSection()}
          {renderSecuritySection()}
          {renderUsersSection()}
          {renderInfoSection()}
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
}); 