import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/contexts/ThemeContext';
import DatePicker from './DatePicker';

interface TaskDueDateModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dueDate: string, recurrencePattern: string | null, isRecurring: boolean) => void;
  taskTitle: string;
  suggestedFrequency: string;
}

const RECURRENCE_OPTIONS = [
  { label: 'No Recurrence', value: null },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'bi-weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-annually', value: 'semi-annually' },
  { label: 'Annually', value: 'annually' }
];

export default function TaskDueDateModal({
  visible,
  onClose,
  onConfirm,
  taskTitle,
  suggestedFrequency
}: TaskDueDateModalProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<string | null>(null);
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  const handleConfirm = () => {
    onConfirm(selectedDate, recurrencePattern, isRecurring);
    onClose();
  };

  const getSuggestedDate = () => {
    const today = new Date();
    const suggestedDate = new Date(today);
    
    // Parse suggested frequency to set a reasonable default date
    const frequency = suggestedFrequency.toLowerCase();
    
    if (frequency.includes('daily') || frequency.includes('day')) {
      suggestedDate.setDate(today.getDate() + 1);
    } else if (frequency.includes('weekly') || frequency.includes('week')) {
      suggestedDate.setDate(today.getDate() + 7);
    } else if (frequency.includes('monthly') || frequency.includes('month')) {
      suggestedDate.setMonth(today.getMonth() + 1);
    } else if (frequency.includes('quarterly') || frequency.includes('3 month')) {
      suggestedDate.setMonth(today.getMonth() + 3);
    } else if (frequency.includes('semi-annually') || frequency.includes('6 month')) {
      suggestedDate.setMonth(today.getMonth() + 6);
    } else if (frequency.includes('annually') || frequency.includes('yearly') || frequency.includes('year')) {
      suggestedDate.setFullYear(today.getFullYear() + 1);
    } else {
      // Default to 1 week from today
      suggestedDate.setDate(today.getDate() + 7);
    }
    
    return suggestedDate.toISOString().split('T')[0];
  };

  const getSuggestedRecurrence = () => {
    const frequency = suggestedFrequency.toLowerCase();
    
    if (frequency.includes('daily') || frequency.includes('day')) {
      return 'daily';
    } else if (frequency.includes('weekly') || frequency.includes('week')) {
      return 'weekly';
    } else if (frequency.includes('monthly') || frequency.includes('month')) {
      return 'monthly';
    } else if (frequency.includes('quarterly') || frequency.includes('3 month')) {
      return 'quarterly';
    } else if (frequency.includes('semi-annually') || frequency.includes('6 month')) {
      return 'semi-annually';
    } else if (frequency.includes('annually') || frequency.includes('yearly') || frequency.includes('year')) {
      return 'annually';
    } else {
      return null;
    }
  };

  React.useEffect(() => {
    if (visible) {
      setSelectedDate(getSuggestedDate());
      const suggestedRecurrence = getSuggestedRecurrence();
      setIsRecurring(suggestedRecurrence !== null);
      setRecurrencePattern(suggestedRecurrence);
    }
  }, [visible, suggestedFrequency]);

  const handleRecurrenceToggle = () => {
    setIsRecurring(!isRecurring);
    if (!isRecurring) {
      setRecurrencePattern(getSuggestedRecurrence());
    } else {
      setRecurrencePattern(null);
    }
  };

  const handleRecurrenceSelect = (pattern: string | null) => {
    setRecurrencePattern(pattern);
    setShowRecurrenceOptions(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set Task Schedule</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>{taskTitle}</Text>
              <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
                Suggested: {suggestedFrequency}
              </Text>
            </View>
            
            <View style={styles.dateSection}>
              <Text style={[styles.dateLabel, { color: colors.text }]}>When is this task due?</Text>
              <DatePicker
                label=""
                value={selectedDate}
                placeholder="Select due date"
                onChange={(dateString) => {
                  if (dateString) {
                    setSelectedDate(dateString);
                  }
                }}
                isOptional={false}
              />
            </View>
            
            <View style={styles.quickOptions}>
              <Text style={[styles.quickOptionsTitle, { color: colors.textSecondary }]}>Quick Options</Text>
              <View style={styles.quickButtons}>
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: colors.primaryLight }]}
                  onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  <Text style={[styles.quickButtonText, { color: colors.primary }]}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: colors.primaryLight }]}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setSelectedDate(tomorrow.toISOString().split('T')[0]);
                  }}
                >
                  <Text style={[styles.quickButtonText, { color: colors.primary }]}>Tomorrow</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickButton, { backgroundColor: colors.primaryLight }]}
                  onPress={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setSelectedDate(nextWeek.toISOString().split('T')[0]);
                  }}
                >
                  <Text style={[styles.quickButtonText, { color: colors.primary }]}>Next Week</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.recurrenceSection}>
              <View style={styles.recurrenceHeader}>
                <Text style={[styles.recurrenceLabel, { color: colors.text }]}>Recurrence</Text>
                <TouchableOpacity
                  style={[
                    styles.recurrenceToggle,
                    { 
                      backgroundColor: isRecurring ? colors.primary : '#E5E7EB',
                      borderColor: isRecurring ? colors.primary : '#D1D5DB'
                    }
                  ]}
                  onPress={handleRecurrenceToggle}
                >
                  <View 
                    style={[
                      styles.recurrenceKnob,
                      { 
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: isRecurring ? 20 : 2 }],
                      }
                    ]} 
                  />
                </TouchableOpacity>
              </View>
              
              {isRecurring && (
                <View style={styles.recurrenceOptions}>
                  <TouchableOpacity
                    style={[
                      styles.recurrenceDropdown,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setShowRecurrenceOptions(!showRecurrenceOptions)}
                  >
                    <Text style={[styles.recurrenceDropdownText, { color: colors.text }]}>
                      {recurrencePattern ? 
                        RECURRENCE_OPTIONS.find(opt => opt.value === recurrencePattern)?.label : 
                        'Select recurrence pattern'
                      }
                    </Text>
                    <Ionicons 
                      name={showRecurrenceOptions ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                  
                  {showRecurrenceOptions && (
                    <View style={[styles.recurrenceOptionsList, { backgroundColor: colors.background }]}>
                      {RECURRENCE_OPTIONS.filter(option => option.value !== null).map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.recurrenceOption,
                            recurrencePattern === option.value && { backgroundColor: colors.primaryLight }
                          ]}
                          onPress={() => handleRecurrenceSelect(option.value)}
                        >
                          <Text style={[
                            styles.recurrenceOptionText,
                            { color: recurrencePattern === option.value ? colors.primary : colors.text }
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.background }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.modalButtonText, { color: colors.background }]}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  taskInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskFrequency: {
    fontSize: 14,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickOptions: {
    marginBottom: 10,
  },
  quickOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recurrenceSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recurrenceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  recurrenceToggle: {
    width: 40,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  recurrenceKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  recurrenceOptions: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  recurrenceDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recurrenceDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recurrenceOptionsList: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  recurrenceOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recurrenceOptionText: {
    fontSize: 14,
  },
}); 