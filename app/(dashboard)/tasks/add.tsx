import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../../lib/contexts/TasksContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';

const TASK_CATEGORIES = [
  {
    name: 'Home Maintenance',
    subcategories: [
      'Filters',
      'Light Bulbs', 
      'Irrigation',
      'Window Cleaning',
      'Furniture Cleaning',
      'Rug Cleaning',
      'Exterior Home',
      'Painting',
      'Gutters',
      'Chimney / Fireplace',
      'Decks / Patio',
      'Tree / Shrub Trimming',
      'Grass cutting',
      'HVAC Service',
      'Sump Pump',
      'Security Systems and Cameras'
    ]
  },
  {
    name: 'Health + Safety',
    subcategories: [
      'Smoke / CO2 Detectors',
      'Fire Extinguisher',
      'Emergency Kit',
      'Medication Clean Out'
    ]
  },
  {
    name: 'Deep Cleaning',
    subcategories: [
      'Fridge',
      'Dryer Vents',
      'Trash Cans',
      'Sheets',
      'Baseboards and Door Frames',
      'Light Fixtures + Ceiling Fans',
      'Vents + Air Returns',
      'Shower Heads',
      'Garbage Disposal',
      'Washer + Dryer',
      'Grout',
      'Garage'
    ]
  },
  {
    name: 'Repairs',
    subcategories: [
      'General Repairs'
    ]
  }
];

const FREQUENCY_OPTIONS = [
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'Quarterly',
  'Semi-annually',
  'Annually',
  'As needed',
  'Custom'
];

const PRIORITY_OPTIONS = [
  'Low',
  'Medium',
  'High',
  'Urgent'
];

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { addTask } = useTasks();
  const params = useLocalSearchParams();
  
  // Pre-select category if passed from task screen
  const initialCategory = params.category as string || '';
  const initialSubcategory = params.subcategory as string || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [suggestedFrequency, setSuggestedFrequency] = useState('');
  const [customFrequency, setCustomFrequency] = useState('');
  const [instructions, setInstructions] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [dropdownTitle, setDropdownTitle] = useState('');

  const selectedCategoryData = TASK_CATEGORIES.find(cat => cat.name === selectedCategory);

  const openDropdown = (type: string, items: string[], title: string) => {
    setActiveDropdown(type);
    setDropdownItems(items);
    setDropdownTitle(title);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const handleDropdownSelect = (value: string) => {
    switch (activeDropdown) {
      case 'category':
        setSelectedCategory(value);
        setSelectedSubcategory(''); // Reset subcategory when category changes
        break;
      case 'subcategory':
        setSelectedSubcategory(value);
        break;
      case 'frequency':
        setSuggestedFrequency(value);
        break;
      case 'priority':
        setPriority(value);
        break;
    }
    closeDropdown();
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!selectedSubcategory) {
      Alert.alert('Error', 'Please select a subcategory');
      return;
    }

    try {
      setLoading(true);

      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        suggested_frequency: suggestedFrequency || 'As needed',
        custom_frequency: customFrequency || null,
        instructions: instructions.trim() || null,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        priority: priority,
        priority_level: priority.toLowerCase(),
        task_type: 'custom',
        is_active: true,
        status: 'pending',
        frequency_type: customFrequency ? 'custom' : 'suggested'
      };

      await addTask(taskData);
      
      Alert.alert('Success', 'Task added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDropdownButton = (
    selectedValue: string,
    onPress: () => void,
    placeholder: string
  ) => (
    <TouchableOpacity
      style={[styles.dropdownButton, { 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }]}
      onPress={onPress}
    >
      <Text style={[styles.dropdownText, { color: selectedValue ? colors.text : colors.textSecondary }]}>
        {selectedValue || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const getSelectedValue = () => {
    switch (activeDropdown) {
      case 'category':
        return selectedCategory;
      case 'subcategory':
        return selectedSubcategory;
      case 'frequency':
        return suggestedFrequency;
      case 'priority':
        return priority;
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Task</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Task Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Task Title *</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter task title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter task description (optional)"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
          {renderDropdownButton(
            selectedCategory,
            () => openDropdown('category', TASK_CATEGORIES.map(cat => cat.name), 'Select category'),
            'Select category'
          )}
        </View>

        {/* Subcategory */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Subcategory *</Text>
          {renderDropdownButton(
            selectedSubcategory,
            () => openDropdown('subcategory', selectedCategoryData?.subcategories || [], 'Select subcategory'),
            'Select subcategory'
          )}
        </View>

        {/* Suggested Frequency */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Suggested Frequency</Text>
          {renderDropdownButton(
            suggestedFrequency,
            () => openDropdown('frequency', FREQUENCY_OPTIONS, 'Select frequency'),
            'Select frequency'
          )}
        </View>

        {/* Custom Frequency */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Custom Frequency</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter custom frequency (optional)"
            placeholderTextColor={colors.textSecondary}
            value={customFrequency}
            onChangeText={setCustomFrequency}
            maxLength={255}
          />
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
          {renderDropdownButton(
            priority,
            () => openDropdown('priority', PRIORITY_OPTIONS, 'Select priority'),
            'Select priority'
          )}
        </View>

        {/* Instructions */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Instructions</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter task instructions (optional)"
            placeholderTextColor={colors.textSecondary}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* Estimated Cost */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Estimated Cost ($)</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter estimated cost (optional)"
            placeholderTextColor={colors.textSecondary}
            value={estimatedCost}
            onChangeText={setEstimatedCost}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Add Task Button */}
        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: loading ? colors.textSecondary : colors.primary 
          }]}
          onPress={handleAddTask}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={24} color={colors.background} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>
            {loading ? 'Adding Task...' : 'Add Task'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={activeDropdown !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{dropdownTitle}</Text>
              <TouchableOpacity onPress={closeDropdown}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {dropdownItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalItem, { 
                    backgroundColor: getSelectedValue() === item ? colors.primaryLight : 'transparent'
                  }]}
                  onPress={() => handleDropdownSelect(item)}
                >
                  <Text style={[styles.modalItemText, { 
                    color: getSelectedValue() === item ? colors.primary : colors.text 
                  }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
  },
}); 