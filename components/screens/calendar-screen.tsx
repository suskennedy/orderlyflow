import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
import CalendarAgendaView from '../../components/calendar/CalendarAgendaView';
import CalendarMonthView from '../../components/calendar/CalendarMonthView';
import CalendarViewToggle from '../../components/calendar/CalendarViewToggle';
import LoadingState from '../../components/layout/LoadingState';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';

// Import hooks and utilities
import { useCalendar } from '../../lib/contexts/CalendarContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { getCalendarTheme, getColorHex } from '../../lib/utils/colorHelpers';

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
  const { colors } = useTheme();
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
    
    console.log('=== CALENDAR MARKING DEBUG ===');
    console.log('Total events to process:', events.length);
    
    // Get current date for generating recurring events
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Generate dates for the current month view (plus some buffer)
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth + 2, 0);
    
    console.log('Calendar view range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    events.forEach((event, index) => {
      console.log(`Processing event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        is_recurring: event.is_recurring,
        recurrence_pattern: event.recurrence_pattern,
        start_time: event.start_time,
        task_id: event.task_id
      });
      
      // Handle regular events
      const eventDate = event.start_time.split('T')[0];
      
      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = [];
      }
      eventsByDate[eventDate].push(event);
      
      // Handle recurring events - generate occurrences for the calendar view
      if (event.is_recurring && event.recurrence_pattern) {
        console.log('🔄 Found recurring event:', event.title, 'Pattern:', event.recurrence_pattern);
        
        const recurringStartDate = new Date(event.start_time);
        const recurringEndDate = event.recurrence_end_date 
          ? new Date(event.recurrence_end_date) 
          : new Date(recurringStartDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
        
        console.log('Recurring event date range:', {
          start: recurringStartDate.toISOString(),
          end: recurringEndDate.toISOString()
        });
        
        // Generate recurring occurrences
        let currentOccurrence = new Date(recurringStartDate);
        let occurrenceCount = 0;
        
        while (currentOccurrence <= recurringEndDate && occurrenceCount < 100) {
          const occurrenceDate = currentOccurrence.toISOString().split('T')[0];
          
          // Only add occurrences that fall within our calendar view range
          if (currentOccurrence >= startDate && currentOccurrence <= endDate) {
            if (!eventsByDate[occurrenceDate]) {
              eventsByDate[occurrenceDate] = [];
            }
            
            // Create a copy of the event for this occurrence
            const occurrenceEvent = {
              ...event,
              id: `${event.id}_${occurrenceCount}`,
              start_time: `${occurrenceDate}T${recurringStartDate.toTimeString().split(' ')[0]}`,
              end_time: `${occurrenceDate}T${new Date(event.end_time).toTimeString().split(' ')[0]}`,
            };
            
            eventsByDate[occurrenceDate].push(occurrenceEvent);
            console.log(`✅ Generated recurring occurrence for ${event.title} on ${occurrenceDate}`);
          }
          
          occurrenceCount++;
          
          // Calculate next occurrence based on pattern
          const pattern = event.recurrence_pattern.toLowerCase();
          switch (pattern) {
            case 'daily':
              currentOccurrence.setDate(currentOccurrence.getDate() + 1);
              break;
            case 'weekly':
              currentOccurrence.setDate(currentOccurrence.getDate() + 7);
              break;
            case 'bi-weekly':
            case 'biweekly':
              currentOccurrence.setDate(currentOccurrence.getDate() + 14);
              break;
            case 'monthly':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 1);
              break;
            case 'quarterly':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 3);
              break;
            case 'semi-annually':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 6);
              break;
            case 'annually':
            case 'yearly':
              currentOccurrence.setFullYear(currentOccurrence.getFullYear() + 1);
              break;
            default:
              currentOccurrence.setDate(currentOccurrence.getDate() + 1);
          }
        }
      }
    });
    
    console.log('Events by date:', Object.keys(eventsByDate).length, 'dates with events');
    
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
      
      console.log(`📅 Marked date ${date} with ${dateEvents.length} events`);
    });
    
    console.log('Total calendar markers created:', Object.keys(markers).length);
    console.log('=== END CALENDAR MARKING DEBUG ===');
    
    return markers;
  }, [events, selectedDate]);

  // Filter events for the selected date
  const selectedDateEvents = useMemo(() => {
    const selectedEvents: any[] = [];
    
    console.log('=== SELECTED DATE EVENTS DEBUG ===');
    console.log('Selected date:', selectedDate);
    console.log('Total events to check:', events.length);
    
    events.forEach((event, index) => {
      console.log(`Checking event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        is_recurring: event.is_recurring,
        recurrence_pattern: event.recurrence_pattern,
        start_time: event.start_time
      });
      
      // Handle regular events
        const eventDate = event.start_time.split('T')[0];
      if (eventDate === selectedDate) {
        selectedEvents.push(event);
        console.log(`✅ Added regular event: ${event.title}`);
      }
      
      // Handle recurring events - generate occurrences for the selected date
      if (event.is_recurring && event.recurrence_pattern) {
        console.log('🔄 Processing recurring event for selected date:', event.title);
        
        const recurringStartDate = new Date(event.start_time);
        const recurringEndDate = event.recurrence_end_date 
          ? new Date(event.recurrence_end_date) 
          : new Date(recurringStartDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
        
        // Generate recurring occurrences
        let currentOccurrence = new Date(recurringStartDate);
        let occurrenceCount = 0;
        
        while (currentOccurrence <= recurringEndDate && occurrenceCount < 100) {
          const occurrenceDate = currentOccurrence.toISOString().split('T')[0];
          
          // Check if this occurrence falls on the selected date
          if (occurrenceDate === selectedDate) {
            // Create a copy of the event for this occurrence
            const occurrenceEvent = {
              ...event,
              id: `${event.id}_${occurrenceCount}`,
              start_time: `${occurrenceDate}T${recurringStartDate.toTimeString().split(' ')[0]}`,
              end_time: `${occurrenceDate}T${new Date(event.end_time).toTimeString().split(' ')[0]}`,
            };
            
            selectedEvents.push(occurrenceEvent);
            console.log(`✅ Found recurring occurrence for ${event.title} on ${selectedDate}`);
          }
          
          occurrenceCount++;
          
          // Calculate next occurrence based on pattern
          const pattern = event.recurrence_pattern.toLowerCase();
          switch (pattern) {
            case 'daily':
              currentOccurrence.setDate(currentOccurrence.getDate() + 1);
              break;
            case 'weekly':
              currentOccurrence.setDate(currentOccurrence.getDate() + 7);
              break;
            case 'bi-weekly':
            case 'biweekly':
              currentOccurrence.setDate(currentOccurrence.getDate() + 14);
              break;
            case 'monthly':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 1);
              break;
            case 'quarterly':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 3);
              break;
            case 'semi-annually':
              currentOccurrence.setMonth(currentOccurrence.getMonth() + 6);
              break;
            case 'annually':
            case 'yearly':
              currentOccurrence.setFullYear(currentOccurrence.getFullYear() + 1);
              break;
            default:
              currentOccurrence.setDate(currentOccurrence.getDate() + 1);
          }
        }
      }
    });
    
    const sortedEvents = selectedEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    console.log('Final selected date events:', sortedEvents.length);
    sortedEvents.forEach(event => {
      console.log(`📅 Event on ${selectedDate}:`, event.title, event.is_recurring ? '(Recurring)' : '');
    });
    console.log('=== END SELECTED DATE EVENTS DEBUG ===');
    
    return sortedEvents;
  }, [events, selectedDate]);

  // Calendar theme customization
  const calendarTheme = getCalendarTheme(colors);

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
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Manage your events</Text>
      </View>
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/calendar/add')}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );

  // Show loading state while fetching data
  if (loading && !refreshing) {
    return <LoadingState message="Loading calendar..." />;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background, 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom + 80 
    }]}>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});