import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { CalendarEvent } from '../../types/database';
import CalendarEventCard from '../dashboard/CalendarCard';

interface MarkingProps {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  dotColor?: string;
  activeOpacity?: number;
  disableTouchEvent?: boolean;
  dots?: Array<{key: string; color: string}>;
  periods?: Array<{startingDay: boolean; endingDay: boolean; color: string}>;
  disabled?: boolean;
}

interface CalendarMonthViewProps {
  selectedDate: string;
  markedDates: Record<string, MarkingProps>;
  selectedDateEvents: CalendarEvent[];
  calendarTheme: object;
  onDayPress: (day: DateData) => void;
  onDeletePress: (event: CalendarEvent) => void;
}

const CalendarMonthView = ({
  selectedDate,
  markedDates,
  selectedDateEvents,
  calendarTheme,
  onDayPress,
  onDeletePress,
}: CalendarMonthViewProps) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Handler to scroll to events section when a day is pressed
  const handleDayPress = (day: DateData) => {
    onDayPress(day);
    // Scroll down to show events automatically
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 370, animated: true });
      }, 100);
    }
  };

  return (
    <ScrollView
      style={styles.mainScrollView}
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={[styles.calendarWrapper, { backgroundColor: colors.surface }]}>
        <Calendar
          markingType="dot"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={calendarTheme}
          enableSwipeMonths
          disableMonthChange={false}
        />
      </View>

      <View style={styles.eventsHeaderContainer}>
        <Text style={[styles.eventsHeaderTitle, { color: colors.text }]}>
          Events for {new Date(selectedDate).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <View style={[styles.eventsHeaderDivider, { backgroundColor: colors.border }]} />
      </View>

      {selectedDateEvents.length === 0 ? (
        <View style={styles.noEventsContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.noEventsText, { color: colors.textTertiary }]}>No events scheduled</Text>
          <TouchableOpacity
            style={[styles.addEventButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/(calendar)/add')}
          >
            <Text style={[styles.addEventText, { color: colors.textInverse }]}>Add Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventsList}>
          {selectedDateEvents.map((event, index) => (
            <View key={`${event.id}_${index}`} style={{ marginBottom: 8 }}>
              <CalendarEventCard event={event} onDelete={onDeletePress} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainScrollView: {
    flex: 1,
  },
  calendarWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    padding: 8,
  },
  eventsHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  eventsHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventsHeaderDivider: {
    height: 1,
    marginTop: 8,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  noEventsText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  addEventButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEventText: {
    fontWeight: '500',
  },
});

export default CalendarMonthView;