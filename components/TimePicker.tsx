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

interface TimePickerProps {
  label: string;
  value: string | null;
  placeholder: string;
  onChange: (timeString: string | null) => void;
  helperText?: string;
  isOptional?: boolean;
  testID?: string;
}

export default function TimePicker({
  label,
  value,
  placeholder,
  onChange,
  helperText,
  isOptional = false,
  testID,
}: TimePickerProps) {
  const { colors } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Parse the time string into a Date object, default to now if not valid
  const parseTime = (timeStr: string | null): Date => {
    if (!timeStr) return new Date();
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      return new Date();
    }
  };

  const handleChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      onChange(timeString);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  const formatDisplayTime = (timeStr: string | null): string => {
    if (!timeStr) return '';
    
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const isPM = h >= 12;
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${isPM ? 'PM' : 'AM'}`;
    } catch (error) {
      return '';
    }
  };

  const renderTimePicker = () => {
    const currentTime = parseTime(value);
    
    if (Platform.OS === 'ios') {
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    testID={testID}
                    value={currentTime}
                    mode="time"
                    display="spinner"
                    onChange={handleChange}
                    style={[styles.timePicker, { backgroundColor: colors.surface }]}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
    }
    
    return showTimePicker && (
      <DateTimePicker
        testID={testID}
        value={currentTime}
        mode="time"
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
        style={[styles.timeButton, { 
          backgroundColor: colors.surface,
          borderColor: colors.border 
        }]}
        onPress={() => setShowTimePicker(true)}
        testID={testID}
      >
        <Text style={[
          value ? styles.timeText : styles.placeholder,
          { color: value ? colors.text : colors.textTertiary }
        ]}>
          {value ? formatDisplayTime(value) : placeholder}
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
          <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
      
      {helperText && <Text style={[styles.helperText, { color: colors.textTertiary }]}>{helperText}</Text>}
      
      {renderTimePicker()}
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
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
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
  timePicker: {
    height: 200,
  },
});