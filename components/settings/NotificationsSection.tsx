import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface NotificationSetting {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  category: string;
}

export default function NotificationsSection() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    // Reminders & Alerts
    { id: 'push', label: 'Push Notifications', enabled: true, category: 'reminders' },
    { id: 'email', label: 'Email Summaries', enabled: true, category: 'reminders' },
    { id: 'maintenance', label: 'Maintenance Alerts', enabled: true, category: 'reminders' },
    { id: 'billing', label: 'Billing & Subscription Alerts', enabled: true, category: 'reminders' },
    
    // Household
    { id: 'family', label: 'Family and Member Activity', enabled: true, category: 'household' },
    
    // Lifestyle & Engagement
    { id: 'tips', label: 'Tips from Flo', enabled: true, category: 'lifestyle' },
    { id: 'recap', label: 'Weekly Recap', enabled: true, category: 'lifestyle' },
    { id: 'promotions', label: 'Promotions & Updates', enabled: true, category: 'lifestyle' },
    
    // System Notifications (always on)
    { id: 'security', label: 'Security & Login Alerts', enabled: true, category: 'system', description: 'Always on' },
    { id: 'recovery', label: 'Account Recovery Updates', enabled: true, category: 'system', description: 'Always on' },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, enabled: !notification.enabled }
          : notification
      )
    );
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'reminders': return 'Reminders & Alerts';
      case 'household': return 'Household';
      case 'lifestyle': return 'Lifestyle & Engagement';
      case 'system': return 'System Notifications (always on)';
      default: return '';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'reminders': return 'Manage how and when Flo reminds you about home tasks.';
      case 'household': return 'Stay in sync with others who share your home.';
      case 'lifestyle': return 'Flo can share home tips, encouragement, and updates.';
      case 'system': return '';
      default: return '';
    }
  };

  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.category]) {
      acc[notification.category] = [];
    }
    acc[notification.category].push(notification);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  const renderNotificationItem = (notification: NotificationSetting) => (
    <View key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationLabel, { color: colors.text }]}>
          {notification.label}
        </Text>
        {notification.description && (
          <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>
            {notification.description}
          </Text>
        )}
      </View>
      <Switch
        value={notification.enabled}
        onValueChange={() => toggleNotification(notification.id)}
        disabled={notification.category === 'system'}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={notification.enabled ? 'white' : colors.textSecondary}
      />
    </View>
  );

  const renderCategory = (category: string, notifications: NotificationSetting[]) => (
    <View key={category} style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Ionicons 
          name="notifications-outline" 
          size={20} 
          color={colors.primary} 
        />
        <Text style={[styles.categoryTitle, { color: colors.text }]}>
          {getCategoryTitle(category)}
        </Text>
      </View>
      
      {getCategoryDescription(category) && (
        <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
          {getCategoryDescription(category)}
        </Text>
      )}
      
      <View style={styles.divider} />
      
      {notifications.map(renderNotificationItem)}
    </View>
  );

  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
      </View>
      
      {Object.entries(groupedNotifications).map(([category, notifications]) => 
        renderCategory(category, notifications)
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
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationDescription: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
