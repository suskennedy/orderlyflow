import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
import CalendarAgendaView from '../../../components/calendar/CalendarAgendaView';
import CalendarMonthView from '../../../components/calendar/CalendarMonthView';
import CalendarViewToggle from '../../../components/calendar/CalendarViewToggle';
import LoadingState from '../../../components/layout/LoadingState';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';

// Import hooks and utilities
import { useCalendar } from '../../../lib/contexts/CalendarContext';
import { getCalendarTheme, getColorHex } from '../../../lib/utils/colorHelpers';

// Define MarkingProps interface for TypeScript
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

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { events, loading, refreshing, deleteEvent, onRefresh } = useCalendar();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');

  // Enhanced format events for calendar markers - with filled color highlights for event dates
  const markedDates = useMemo(() => {
    const markers: Record<string, MarkingProps> = {};
    
    // Create a map of dates to their respective events
    const eventsByDate: Record<string, any[]> = {};
    
    events.forEach(event => {
      // Get date part of the start time
      const eventDate = event.start_time.split('T')[0];
      
      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = [];
      }
      eventsByDate[eventDate].push(event);
    });
    
    // Create markers for each date
    Object.keys(eventsByDate).forEach(date => {
      const dateEvents = eventsByDate[date];
      const primaryColor = dateEvents[0].color || 'blue';
      
      markers[date] = {
        marked: true,
        selectedColor: getColorHex(primaryColor) + '40',
        dotColor: getColorHex(primaryColor),
        // Add dots for multi-dot representation
        dots: dateEvents.map(event => ({
          key: event.id,
          color: getColorHex(event.color || 'blue')
        }))
      };
    });
    
    // Mark selected date with a stronger highlight
    if (selectedDate) {
      // If the selected date has events, preserve its dots
      if (markers[selectedDate]) {
        markers[selectedDate] = {
          ...markers[selectedDate],
          selected: true,
          selectedColor: '#4F46E5',
          selectedTextColor: '#FFFFFF',
        };
      } else {
        // If no events on selected date
        markers[selectedDate] = {
          selected: true,
          selectedColor: '#4F46E5',
          selectedTextColor: '#FFFFFF',
        };
      }
    }
    
    return markers;
  }, [events, selectedDate]);

  // Filter events for the selected date
  const selectedDateEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = event.start_time.split('T')[0];
        return eventDate === selectedDate;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [events, selectedDate]);

  // Calendar theme customization
  const calendarTheme = getCalendarTheme();

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleViewChange = (view: 'month' | 'agenda') => {
    setCalendarView(view);
  };

  const handleDeletePress = (event: any) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      await deleteEvent(selectedEvent.id);
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Render the header section
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Manage your events</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/calendar/add')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  // Show loading state while fetching data
  if (loading && !refreshing) {
    return <LoadingState message="Loading calendar..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
      {renderHeader()}
      <CalendarViewToggle currentView={calendarView} onViewChange={handleViewChange} />

      {calendarView === 'month' ? (
        <CalendarMonthView
          selectedDate={selectedDate}
          markedDates={markedDates}
          selectedDateEvents={selectedDateEvents}
          calendarTheme={calendarTheme}
          onDayPress={handleDayPress}
          onDeletePress={handleDeletePress}
        />
      ) : (
        <CalendarAgendaView
          events={events}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onDeletePress={handleDeletePress}
        />
      )}

      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});