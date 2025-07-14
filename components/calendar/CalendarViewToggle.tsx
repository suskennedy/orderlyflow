import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface CalendarViewToggleProps {
  currentView: 'month' | 'agenda';
  onViewChange: (view: 'month' | 'agenda') => void;
}

const CalendarViewToggle = ({
  currentView,
  onViewChange,
}: CalendarViewToggleProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          currentView === 'month' && { backgroundColor: colors.primaryLight },
        ]}
        onPress={() => onViewChange('month')}
        accessibilityLabel="Month view"
      >
        <Ionicons
          name="calendar"
          size={18}
          color={currentView === 'month' ? colors.primary : colors.textTertiary}
        />
        <Text
          style={[
            styles.viewToggleText,
            { color: currentView === 'month' ? colors.primary : colors.textTertiary },
          ]}
        >
          Month
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewToggleButton,
          currentView === 'agenda' && { backgroundColor: colors.primaryLight },
        ]}
        onPress={() => onViewChange('agenda')}
        accessibilityLabel="Agenda view"
      >
        <Ionicons
          name="list"
          size={18}
          color={currentView === 'agenda' ? colors.primary : colors.textTertiary}
        />
        <Text
          style={[
            styles.viewToggleText,
            { color: currentView === 'agenda' ? colors.primary : colors.textTertiary },
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
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default CalendarViewToggle;