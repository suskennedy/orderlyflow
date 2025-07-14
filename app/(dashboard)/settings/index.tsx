import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeSwitcher from '../../../components/ui/ThemeSwitcher';
import { useTheme } from '../../../lib/contexts/ThemeContext';

export default function SettingsScreen() {
  const { colors, theme, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Customize your app</Text>
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
      paddingBottom: insets.bottom + 80
    }]}>
      {renderHeader()}
      
      <View style={styles.content}>
        {renderThemeSection()}
        {renderInfoSection()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
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