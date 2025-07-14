import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useTheme } from '../lib/contexts/ThemeContext';

interface DatePickerProps {
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (dateString: string | null) => void;
  helperText?: string;
  isOptional?: boolean;
  testID?: string;
}

export default function DatePicker({
  label,
  value,
  placeholder,
  onChange,
  helperText,
  isOptional = false,
  testID,
}: DatePickerProps) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  
  // Parse the date string into a Date object, default to today if not valid
  const parseDate = (dateStr: string | null): Date => {
    if (!dateStr) return new Date();
    
    try {
      // Split by T in case we get an ISO string with time
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Check if valid date, otherwise return today
      return !isNaN(date.getTime()) ? date : new Date();
    } catch (error) {
      console.log('Error parsing date:', error);
      return new Date();
    }
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    // On Android, dismiss the picker immediately
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      onChange(dateString);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return '';
    }
  };

  const openPicker = () => {
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  // Render the actual date picker based on platform
  const renderDatePicker = () => {
    const currentDate = parseDate(value);
    
    if (Platform.OS === 'ios') {
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPicker}
          onRequestClose={closePicker}
        >
          <TouchableWithoutFeedback onPress={closePicker}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={closePicker}>
                      <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closePicker}>
                      <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    testID={testID}
                    value={currentDate}
                    mode="date"
                    display="spinner"
                    onChange={handleChange}
                    style={[styles.datePicker, { backgroundColor: colors.surface }]}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
    
    return showPicker && (
      <DateTimePicker
        testID={testID}
        value={currentDate}
        mode="date"
        display="default"
        onChange={handleChange}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
        {isOptional && <Text style={[styles.optional, { color: colors.textTertiary }]}> (Optional)</Text>}
      </Text>
      
      <TouchableOpacity
        style={[styles.dateButton, { 
          backgroundColor: colors.surface,
          borderColor: colors.border 
        }]}
        onPress={openPicker}
        testID={testID}
        activeOpacity={0.7}
      >
        <Text style={[
          value ? styles.dateText : styles.placeholder,
          { color: value ? colors.text : colors.textTertiary }
        ]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <View style={styles.iconContainer}>
          {value && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          <Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
      
      {helperText && <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>}
      
      {renderDatePicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  optional: {
    fontWeight: '400',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  placeholder: {
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
  },
});
