import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import TaskDueDateModal from '../TaskDueDateModal';

// Pre-set task templates
const PRESET_TASKS = [
  {
    id: 'preset-1',
    title: 'Change Air Filter',
    category: 'Home Maintenance',
    subcategory: 'Filters',
    suggested_frequency: 'Every 3 months',
    description: 'Replace or clean air filters in HVAC system',
    priority: 'Medium',
    estimated_duration_minutes: 30,
    instructions: 'Turn off HVAC system, locate filter, remove old filter, insert new filter, turn system back on'
  },
  {
    id: 'preset-2',
    title: 'Test Smoke Detectors',
    category: 'Health + Safety',
    subcategory: 'Smoke / CO2 Detectors',
    suggested_frequency: 'Monthly',
    description: 'Test all smoke and CO2 detectors in the home',
    priority: 'High',
    estimated_duration_minutes: 15,
    instructions: 'Press test button on each detector, replace batteries if needed, check expiration dates'
  },
  {
    id: 'preset-3',
    title: 'Clean Garbage Disposal',
    category: 'Deep Cleaning',
    subcategory: 'Garbage Disposal',
    suggested_frequency: 'Monthly',
    description: 'Deep clean and deodorize garbage disposal',
    priority: 'Low',
    estimated_duration_minutes: 20,
    instructions: 'Run cold water, add ice cubes and salt, run disposal, add lemon or vinegar for freshness'
  },
  {
    id: 'preset-4',
    title: 'Clean Dryer Vent',
    category: 'Deep Cleaning',
    subcategory: 'Dryer Vents',
    suggested_frequency: 'Annually',
    description: 'Remove lint buildup from dryer vent system',
    priority: 'Medium',
    estimated_duration_minutes: 60,
    instructions: 'Disconnect dryer, clean vent pipe, remove lint from exterior vent, reconnect dryer'
  },
  {
    id: 'preset-5',
    title: 'Inspect Fire Extinguisher',
    category: 'Health + Safety',
    subcategory: 'Fire Extinguisher',
    suggested_frequency: 'Annually',
    description: 'Check fire extinguisher condition and pressure',
    priority: 'High',
    estimated_duration_minutes: 10,
    instructions: 'Check pressure gauge, inspect for damage, ensure accessibility, note expiration date'
  },
  {
    id: 'preset-6',
    title: 'Clean Refrigerator Coils',
    category: 'Deep Cleaning',
    subcategory: 'Fridge',
    suggested_frequency: 'Every 6 months',
    description: 'Vacuum refrigerator condenser coils',
    priority: 'Medium',
    estimated_duration_minutes: 30,
    instructions: 'Unplug refrigerator, locate coils (usually at back or bottom), vacuum dust and debris'
  },
  {
    id: 'preset-7',
    title: 'Replace Light Bulbs',
    category: 'Home Maintenance',
    subcategory: 'Light Bulbs',
    suggested_frequency: 'As needed',
    description: 'Replace burned out light bulbs throughout the home',
    priority: 'Low',
    estimated_duration_minutes: 45,
    instructions: 'Check all fixtures, replace with energy-efficient bulbs, dispose of old bulbs properly'
  },
  {
    id: 'preset-8',
    title: 'Clean Window Screens',
    category: 'Home Maintenance',
    subcategory: 'Window Cleaning',
    suggested_frequency: 'Seasonally',
    description: 'Remove and clean window screens',
    priority: 'Low',
    estimated_duration_minutes: 60,
    instructions: 'Remove screens, wash with mild soap, rinse thoroughly, let dry, reinstall'
  },
  {
    id: 'preset-9',
    title: 'Update Emergency Kit',
    category: 'Health + Safety',
    subcategory: 'Emergency Kit',
    suggested_frequency: 'Every 6 months',
    description: 'Review and update emergency supplies',
    priority: 'Medium',
    estimated_duration_minutes: 30,
    instructions: 'Check expiration dates, replace expired items, add missing supplies, update contact list'
  },
  {
    id: 'preset-10',
    title: 'Clean Washing Machine',
    category: 'Deep Cleaning',
    subcategory: 'Washer + Dryer',
    suggested_frequency: 'Monthly',
    description: 'Clean washing machine drum and dispenser',
    priority: 'Low',
    estimated_duration_minutes: 45,
    instructions: 'Run empty cycle with vinegar, clean dispenser drawer, wipe down door seal'
  },
  {
    id: 'preset-11',
    title: 'Inspect HVAC System',
    category: 'Home Maintenance',
    subcategory: 'HVAC Service',
    suggested_frequency: 'Annually',
    description: 'Professional inspection and maintenance of HVAC system',
    priority: 'High',
    estimated_duration_minutes: 120,
    instructions: 'Schedule professional inspection, clean ducts, check refrigerant levels, test system efficiency'
  },
  {
    id: 'preset-12',
    title: 'Clean Gutters',
    category: 'Home Maintenance',
    subcategory: 'Gutters',
    suggested_frequency: 'Seasonally',
    description: 'Remove debris from roof gutters and downspouts',
    priority: 'Medium',
    estimated_duration_minutes: 90,
    instructions: 'Use ladder safely, remove leaves and debris, check for damage, ensure proper drainage'
  },
  {
    id: 'preset-13',
    title: 'Test Carbon Monoxide Detectors',
    category: 'Health + Safety',
    subcategory: 'Smoke / CO2 Detectors',
    suggested_frequency: 'Monthly',
    description: 'Test CO detectors and replace batteries',
    priority: 'High',
    estimated_duration_minutes: 10,
    instructions: 'Press test button, replace batteries if needed, check expiration date, ensure proper placement'
  },
  {
    id: 'preset-14',
    title: 'Deep Clean Carpets',
    category: 'Deep Cleaning',
    subcategory: 'Rug Cleaning',
    suggested_frequency: 'Annually',
    description: 'Professional deep cleaning of carpets and rugs',
    priority: 'Low',
    estimated_duration_minutes: 180,
    instructions: 'Move furniture, vacuum thoroughly, spot treat stains, use professional cleaning service'
  },
  {
    id: 'preset-15',
    title: 'Fix Leaky Faucet',
    category: 'Repairs',
    subcategory: 'General Repairs',
    suggested_frequency: 'As needed',
    description: 'Repair or replace leaking faucet',
    priority: 'Medium',
    estimated_duration_minutes: 60,
    instructions: 'Turn off water supply, disassemble faucet, replace worn parts, test for leaks'
  }
];

const CATEGORIES = [
  { name: 'Home Maintenance', icon: 'home', color: '#3B82F6' },
  { name: 'Health + Safety', icon: 'shield-checkmark', color: '#EF4444' },
  { name: 'Deep Cleaning', icon: 'sparkles', color: '#10B981' },
  { name: 'Repairs', icon: 'construct', color: '#F59E0B' }
];

export default function TaskSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { tasks, addTask, deleteTask } = useTasks();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [selectedPresetTask, setSelectedPresetTask] = useState<any>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAddPresetTask = async (presetTask: any) => {
    const isAlreadyAdded = isTaskAlreadyAdded(presetTask);
    
    if (isAlreadyAdded) {
      // Remove the task if it's already added
      try {
        const existingTask = tasks.find(task => 
          task.title === presetTask.title && 
          task.category === presetTask.category
        );
        
        if (existingTask) {
          await deleteTask(existingTask.id);
          Alert.alert(
            'Task Removed!',
            `${presetTask.title} has been removed from your task list.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error removing task:', error);
        Alert.alert('Error', 'Failed to remove task. Please try again.');
      }
    } else {
      // Show due date modal for predefined tasks
      setSelectedPresetTask(presetTask);
      setShowDueDateModal(true);
    }
  };

  const handleDueDateConfirm = async (dueDate: string, recurrencePattern: string | null, isRecurring: boolean) => {
    if (!selectedPresetTask) return;
    
    try {
      await addTask({
        title: selectedPresetTask.title,
        category: selectedPresetTask.category,
        subcategory: selectedPresetTask.subcategory,
        suggested_frequency: selectedPresetTask.suggested_frequency,
        description: selectedPresetTask.description,
        priority: selectedPresetTask.priority,
        estimated_duration_minutes: selectedPresetTask.estimated_duration_minutes,
        instructions: selectedPresetTask.instructions,
        is_active: true,
        task_type: 'preset',
        priority_level: selectedPresetTask.priority,
        room_location: 'General',
        due_date: dueDate,
        is_recurring: isRecurring,
        recurrence_pattern: recurrencePattern,
        is_recurring_task: isRecurring,
        recurrence_interval: 1,
        recurrence_unit: 'months'
      });
      
      const recurrenceText = isRecurring && recurrencePattern ? 
        ` with ${recurrencePattern} recurrence` : '';
      
      Alert.alert(
        'Task Added!',
        `${selectedPresetTask.title} has been added to your task list with due date ${new Date(dueDate).toLocaleDateString()}${recurrenceText}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding preset task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    } finally {
      setSelectedPresetTask(null);
    }
  };

  const isTaskAlreadyAdded = (presetTask: any) => {
    return tasks.some(task => 
      task.title === presetTask.title && 
      task.category === presetTask.category
    );
  };

  const getFilteredTasks = () => {
    if (selectedCategory === 'All') {
      return PRESET_TASKS;
    }
    return PRESET_TASKS.filter(task => task.category === selectedCategory);
  };

  const renderCategoryFilter = () => (
    <Animated.View 
      style={[
        styles.categoryFilter,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Category</Text>
      <FlatList
        data={[{ name: 'All', icon: 'grid', color: colors.primary }, ...CATEGORIES]}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              { 
                backgroundColor: selectedCategory === item.name ? item.color : colors.surface,
                borderColor: item.color
              }
            ]}
            onPress={() => setSelectedCategory(item.name)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={item.icon as any} 
              size={16} 
              color={selectedCategory === item.name ? colors.background : item.color} 
            />
            <Text style={[
              styles.categoryChipText, 
              { color: selectedCategory === item.name ? colors.background : item.color }
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.name}
      />
    </Animated.View>
  );

  const renderPresetTask = ({ item, index }: { item: any; index: number }) => {
    const isExpanded = expandedTasks.includes(item.id);
    const isAlreadyAdded = isTaskAlreadyAdded(item);
    
    return (
      <Animated.View
        style={[
          styles.taskCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.taskHeader, { backgroundColor: colors.surface }]}
          onPress={() => toggleTaskExpansion(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.taskInfo}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
              {item.category} • {item.subcategory}
            </Text>
            <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
              {item.suggested_frequency}
            </Text>
          </View>
          
          <View style={styles.taskActions}>
            <TouchableOpacity
              style={[
                styles.toggleContainer,
                { 
                  backgroundColor: isAlreadyAdded ? colors.primary : '#E5E7EB',
                  borderColor: isAlreadyAdded ? colors.primary : '#D1D5DB'
                }
              ]}
              onPress={() => handleAddPresetTask(item)}
              activeOpacity={0.8}
            >
              <Animated.View 
                style={[
                  styles.toggleKnob,
                  { 
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: isAlreadyAdded ? 20 : 2 }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 3,
                    elevation: 4
                  }
                ]} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleTaskExpansion(item.id)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View 
            style={[
              styles.taskDetails,
              { backgroundColor: colors.surface }
            ]}
          >
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>{item.description}</Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Instructions</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>{item.instructions}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Priority</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{item.priority}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.detailText, { color: colors.text }]}>{item.estimated_duration_minutes} min</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.headerSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.headerTitleContainer}>
        <Text style={[styles.mainHeaderTitle, { color: colors.text }]}>Task Templates</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Select from pre-made tasks or create your own
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="library" size={20} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {PRESET_TASKS.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Available Templates
            </Text>
          </View>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {tasks.filter(t => t.task_type === 'preset').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Added to Your List
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Task Settings</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/(dashboard)/tasks/add' as any)}
        >
          <Ionicons name="add" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getFilteredTasks()}
        renderItem={renderPresetTask}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list, 
          { paddingBottom: insets.bottom + 120 }
        ]}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderCategoryFilter()}
          </>
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        bounces={true}
        alwaysBounceVertical={false}
      />
      
      <TaskDueDateModal
        visible={showDueDateModal}
        onClose={() => {
          setShowDueDateModal(false);
          setSelectedPresetTask(null);
        }}
        onConfirm={handleDueDateConfirm}
        taskTitle={selectedPresetTask?.title || ''}
        suggestedFrequency={selectedPresetTask?.suggested_frequency || ''}
      />
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  createButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitleContainer: {
    marginBottom: 20,
  },
  mainHeaderTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryList: {
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  taskCard: {
    marginBottom: 8,
  },
  taskHeader: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  taskCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskFrequency: {
    fontSize: 12,
    fontWeight: '400',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleContainer: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  expandButton: {
    padding: 8,
  },
  taskDetails: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 20,
  },
  detailItem: {
    flex: 1,
  },
  separator: {
    height: 16,
  },
}); 