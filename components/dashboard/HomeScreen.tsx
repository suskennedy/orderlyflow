import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCalendar } from '../../lib/contexts/CalendarContext';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useAuth } from '../../lib/hooks/useAuth';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { homes, loading: homesLoading, onRefresh: homesRefresh } = useHomes();
  const { tasks: allTasks, loading: tasksLoading, onRefresh: tasksRefresh } = useTasks();
  const { events, loading: eventsLoading, onRefresh: eventsRefresh } = useCalendar();
  const { vendors, loading: vendorsLoading, onRefresh: vendorsRefresh } = useVendors();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Get the latest 5 items from each context
  const tasks = allTasks.slice(0, 5);
  const recentEvents = events.slice(0, 5);
  const recentVendors = vendors.slice(0, 5);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh all contexts using their onRefresh methods
    Promise.all([
      homesRefresh?.() || Promise.resolve(),
      tasksRefresh?.() || Promise.resolve(),
      eventsRefresh?.() || Promise.resolve(),
      vendorsRefresh?.() || Promise.resolve(),
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => task.status !== 'completed').slice(0, 3);
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return recentEvents.filter(event => new Date(event.start_time) >= now).slice(0, 3);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      {/* Upper Left - Home (Dashboard) and Profile/User */}
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/' as any)}
        >
          <Ionicons name="home" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(profile)' as any)}
        >
          <Ionicons name="person" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Center - Empty space where Dashboard text was */}
      <View style={styles.headerCenter} />

      {/* Upper Right - Settings, Info, and Flo */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(settings)' as any)}
        >
          <Ionicons name="settings" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/info' as any)}
        >
          <Ionicons name="information-circle" size={20} color={colors.text} />
        </TouchableOpacity>
        
      </View>
    </View>
  );

  const renderQuickLinks = () => (
    <View style={styles.quickLinksContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Links</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickLinksScroll}
      >
        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(vendors)/add' as any)}
        >
          <Ionicons name="person-add" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/tasks/add' as any)}
        >
          <Ionicons name="checkbox" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/info' as any)}
        >
          <Ionicons name="chatbubble" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Ask Flo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickLinkButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(home)/add' as any)}
        >
          <Ionicons name="construct" size={24} color={colors.text} />
          <Text style={[styles.quickLinkText, { color: colors.text }]}>Add Appliance</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderTasks = () => (
    <View style={styles.tasksContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
      <View style={styles.tasksColumns}>
        {/* This Week Column */}
        <View style={styles.taskColumn}>
          <Text style={[styles.columnTitle, { color: colors.text }]}>This Week</Text>
          
          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>Home Maintenance</Text>
          </View>
          <View style={styles.taskItems}>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Replace air filter</Text>
            </View>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Call plumber</Text>
            </View>
          </View>

          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>Deep Cleaning</Text>
          </View>
          <View style={styles.taskItems}>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Check smoke alarms</Text>
            </View>
          </View>

          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>Repair List</Text>
          </View>
          <View style={styles.taskItems}>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Clean gutters</Text>
            </View>
          </View>
        </View>

        {/* This Month Column */}
        <View style={styles.taskColumn}>
          <Text style={[styles.columnTitle, { color: colors.text }]}>This Month</Text>
          
          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>Home Maintenance</Text>
          </View>
          <View style={styles.taskItems}>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Flush water heater</Text>
            </View>
          </View>

          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>Deep Cleaning</Text>
          </View>
          <View style={styles.taskItems}>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Clean baseboards</Text>
            </View>
          </View>

          <View style={[styles.taskCategory, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.categoryTitle, { color: colors.textInverse }]}>Repair List</Text>
          </View>
          <View style={styles.taskItems}>
            <View style={styles.taskItem}>
              <Ionicons name="square-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.taskText, { color: colors.text }]}>Touch up paint</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderQuickLinks()}
        {renderTasks()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerCenter: {
    width: 100, // Adjust as needed for the empty space
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  quickLinksContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickLinksScroll: {
    paddingRight: 20,
  },
  quickLinkButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    minHeight: 80,
  },
  quickLinkText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tasksContainer: {
    marginBottom: 30,
  },
  tasksColumns: {
    flexDirection: 'row',
    gap: 20,
  },
  taskColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskCategory: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskItems: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  taskText: {
    marginLeft: 8,
    fontSize: 14,
  },
}); 