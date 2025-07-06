import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CalendarViewToggleProps {
  currentView: 'month' | 'agenda';
  onViewChange: (view: 'month' | 'agenda') => void;
}

const CalendarViewToggle = ({
  currentView,
  onViewChange,
}: CalendarViewToggleProps) => {
  return (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          currentView === 'month' && styles.viewToggleButtonActive,
        ]}
        onPress={() => onViewChange('month')}
        accessibilityLabel="Month view"
      >
        <Ionicons
          name="calendar"
          size={18}
          color={currentView === 'month' ? '#4F46E5' : '#6B7280'}
        />
        <Text
          style={[
            styles.viewToggleText,
            currentView === 'month' && styles.viewToggleTextActive,
          ]}
        >
          Month
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          currentView === 'agenda' && styles.viewToggleButtonActive,
        ]}
        onPress={() => onViewChange('agenda')}
        accessibilityLabel="Agenda view"
      >
        <Ionicons
          name="list"
          size={18}
          color={currentView === 'agenda' ? '#4F46E5' : '#6B7280'}
        />
        <Text
          style={[
            styles.viewToggleText,
            currentView === 'agenda' && styles.viewToggleTextActive,
          ]}
        >
          Agenda
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#6B7280',
  },
  viewToggleTextActive: {
    color: '#4F46E5',
  },
});

export default CalendarViewToggle;