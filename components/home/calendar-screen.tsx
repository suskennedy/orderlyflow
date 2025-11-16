import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
  import CalendarAgendaView from '../calendar/CalendarAgendaView';
import CalendarMonthView from '../calendar/CalendarMonthView';
import CalendarViewToggle from '../calendar/CalendarViewToggle';
import LoadingState from '../layouts/layout/LoadingState';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';

// Import hooks and utilities
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useCalendar } from '../../lib/hooks/useCalendar';
import { useHomesStore } from '../../lib/stores/homesStore';
import { useTasksStore } from '../../lib/stores/tasksStore';
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
  dots?: {key: string; color: string}[];
  periods?: {startingDay: boolean; endingDay: boolean; color: string}[];
  disabled?: boolean;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { 
    events,   // eslint-disable-line @typescript-eslint/no-unused-vars
    loading: calendarLoading, 
    refreshing, 
    deleteEvent, 
    onRefresh,
    currentHomeId,
    setCurrentHome,
    getFilteredEvents
  } = useCalendar();
  const homeTasksByHome = useTasksStore(state => state.homeTasksByHome);
  const tasksLoading = useTasksStore(state => state.loading);
  const currentTasksHomeId = useTasksStore(state => state.currentHomeId);
  const setCurrentHomeId = useTasksStore(state => state.setCurrentHomeId);
  const fetchHomeTasks = useTasksStore(state => state.fetchHomeTasks);
  const homeTasks = currentTasksHomeId ? (homeTasksByHome[currentTasksHomeId] || []) : [];
  const homes = useHomesStore(state => state.homes);
  const currentHome = currentHomeId ? homes.find(home => home.id === currentHomeId) : null;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');

  // Use homeTasks instead of templateTasks to show only tasks for the current home
  const tasks = homeTasks || [];

  // Automatically set the current home in calendar context when there's a current home
  useEffect(() => {
    if (currentHome && currentHome.id !== currentHomeId) {
      setCurrentHome(currentHome.id);
    }
  }, [currentHome, currentHomeId, setCurrentHome]);
  
  // Set current home in tasks store and fetch tasks
  useEffect(() => {
    if (currentHomeId && currentHomeId !== currentTasksHomeId) {
      setCurrentHomeId(currentHomeId);
      fetchHomeTasks(currentHomeId);
    }
  }, [currentHomeId, currentTasksHomeId, setCurrentHomeId, fetchHomeTasks]);

  // Use filtered events based on current home selection
  const filteredEvents = useMemo(() => {
    return getFilteredEvents();
  }, [getFilteredEvents]);

  // Convert tasks to calendar events
  const taskEvents = useMemo(() => {
    const taskCalendarEvents: any[] = [];
    
    // Get all task IDs that already have calendar events
    const tasksWithCalendarEvents = new Set(filteredEvents.map(event => event.home_task_id).filter(Boolean));
    
    tasks.forEach((task) => {
      if (!task.is_active || task.status === 'completed') return;
      
      // Skip tasks that already have calendar events
      if (tasksWithCalendarEvents.has(task.id)) {
        console.log('Skipping task with existing calendar events:', task.title);
        return;
      }
      
      // Get task due date or use created date as fallback
      const taskDate = task.due_date || task.created_at?.split('T')[0];
      if (!taskDate) return;
      
      // Determine event color based on priority
      const getTaskColor = (priority: string | null) => {
        switch (priority?.toLowerCase()) {
          case 'urgent': return 'red';
          case 'high': return 'orange';
          case 'medium': return 'blue';
          case 'low': return 'green';
          default: return 'gray';
        }
      };

      const eventColor = getTaskColor(task.priority as string);
      
      // Create base task event
      const taskEvent = {
        id: `home_task_${task.id}`,
        title: `Task: ${task.title}`,
        description: task.description || `Task: ${task.title}`,
        start_time: `${taskDate}T09:00:00`,
        end_time: `${taskDate}T10:00:00`,
        color: eventColor,
        all_day: false,
        home_task_id: task.id, // Use home_task_id instead of task_id
        is_recurring: task.is_recurring || false,
        recurrence_pattern: task.recurrence_pattern,
        recurrence_end_date: task.recurrence_end_date,
        type: 'home_task'
      };
      
      taskCalendarEvents.push(taskEvent);
    });
    
    return taskCalendarEvents;
  }, [tasks, filteredEvents]);

  // Combine calendar events and task events
  const allEvents = useMemo(() => {
    return [...filteredEvents, ...taskEvents];
  }, [filteredEvents, taskEvents]);

  // Enhanced format events for calendar markers - with filled color highlights for event dates
  const markedDates = useMemo(() => {
    const markers: Record<string, MarkingProps> = {};
    
    // Create a map of dates to their respective events
    const eventsByDate: Record<string, any[]> = {};
    
    console.log('=== CALENDAR MARKING DEBUG ===');
    console.log('Total events to process:', allEvents.length);
    console.log('Filtered calendar events:', filteredEvents.length);
    console.log('Task events:', taskEvents.length);
    
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
    
    allEvents.forEach((event, index) => {
      console.log(`Processing event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        is_recurring: event.is_recurring,
        recurrence_pattern: event.recurrence_pattern,
        start_time: event.start_time,
        task_id: event.task_id,
        type: event.type
      });
      
      // Handle regular events
      const eventDate = event.start_time.split('T')[0];
      
      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = [];
      }
      
      // Check if this event is already added to avoid duplicates
      const isDuplicate = eventsByDate[eventDate].some(existingEvent => 
        existingEvent.id === event.id || 
        (existingEvent.home_task_id && existingEvent.home_task_id === event.home_task_id && 
         existingEvent.start_time === event.start_time)
      );
      
      if (!isDuplicate) {
        eventsByDate[eventDate].push(event);
      } else {
        console.log('Skipping duplicate event:', event.title, event.start_time);
      }
      
      // Handle recurring events - generate occurrences for the calendar view
      if (event.is_recurring && event.recurrence_pattern && !event.id.includes('_occurrence_')) {
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
            
            // Check if this occurrence already exists to avoid duplicates
            const isOccurrenceDuplicate = eventsByDate[occurrenceDate].some(existingEvent => 
              existingEvent.home_task_id === event.home_task_id && 
              existingEvent.start_time.startsWith(occurrenceDate)
            );
            
            if (!isOccurrenceDuplicate) {
              // Create a copy of the event for this occurrence
              const occurrenceEvent = {
                ...event,
                id: `${event.id}_occurrence_${occurrenceCount}`,
                start_time: `${occurrenceDate}T${recurringStartDate.toTimeString().split(' ')[0]}`,
                end_time: `${occurrenceDate}T${new Date(event.end_time).toTimeString().split(' ')[0]}`,
              };
              
              eventsByDate[occurrenceDate].push(occurrenceEvent);
              console.log(`✅ Generated recurring occurrence for ${event.title} on ${occurrenceDate}`);
            } else {
              console.log(`⏭️ Skipping duplicate occurrence for ${event.title} on ${occurrenceDate}`);
            }
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
        dots: dateEvents.map((event, dotIndex) => ({
          key: `${event.id}_dot_${dotIndex}`,
          color: getColorHex(event.color || 'blue')
        }))
      };
      
      console.log(`📅 Marked date ${date} with ${dateEvents.length} events`);
    });
    
    console.log('Total calendar markers created:', Object.keys(markers).length);
    console.log('=== END CALENDAR MARKING DEBUG ===');
    
    return markers;
  }, [allEvents, selectedDate]);

  // Filter events for the selected date
  const selectedDateEvents = useMemo(() => {
    const selectedEvents: any[] = [];
    const processedTaskIds = new Set(); // Track processed task IDs to avoid duplicates
    
    console.log('=== SELECTED DATE EVENTS DEBUG ===');
    console.log('Selected date:', selectedDate);
    console.log('Total events to check:', allEvents.length);
    
    allEvents.forEach((event, index) => {
      console.log(`Checking event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        is_recurring: event.is_recurring,
        recurrence_pattern: event.recurrence_pattern,
        start_time: event.start_time,
        type: event.type
      });
      
      // Handle regular events
      const eventDate = event.start_time.split('T')[0];
      if (eventDate === selectedDate) {
        // Check if we already have an event for this task on this date
        if (event.home_task_id && processedTaskIds.has(`${event.home_task_id}_${eventDate}`)) {
          console.log(`⏭️ Skipping duplicate task event: ${event.title}`);
          return;
        }
        
        selectedEvents.push(event);
        if (event.home_task_id) {
          processedTaskIds.add(`${event.home_task_id}_${eventDate}`);
        }
        console.log(`✅ Added regular event: ${event.title}`);
      }
      
      // Handle recurring events - generate occurrences for the selected date
      if (event.is_recurring && event.recurrence_pattern && !event.id.includes('_occurrence_')) {
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
            // Check if we already have an event for this task on this date
            if (event.home_task_id && processedTaskIds.has(`${event.home_task_id}_${occurrenceDate}`)) {
              console.log(`⏭️ Skipping duplicate recurring occurrence: ${event.title}`);
              break; // Skip this entire recurring event if we already have it
            }
            
            // Create a copy of the event for this occurrence
            const occurrenceEvent = {
              ...event,
              id: `${event.id}_occurrence_${occurrenceCount}`,
              start_time: `${occurrenceDate}T${recurringStartDate.toTimeString().split(' ')[0]}`,
              end_time: `${occurrenceDate}T${new Date(event.end_time).toTimeString().split(' ')[0]}`,
            };
            
            selectedEvents.push(occurrenceEvent);
            if (event.home_task_id) {
              processedTaskIds.add(`${event.home_task_id}_${occurrenceDate}`);
            }
            console.log(`✅ Found recurring occurrence for ${event.title} on ${selectedDate}`);
            break; // Only add one occurrence per recurring event
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
      console.log(`📅 Event on ${selectedDate}:`, event.title, event.is_recurring ? '(Recurring)' : '', event.type === 'task' ? '(Task)' : '');
    });
    console.log('=== END SELECTED DATE EVENTS DEBUG ===');
    
    return sortedEvents;
  }, [allEvents, selectedDate]);

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
      // If it's a task event, navigate to tasks instead of deleting
      if (selectedEvent.type === 'task' || selectedEvent.type === 'home_task') {
        setShowDeleteModal(false);
        setSelectedEvent(null);
        router.push('/(dashboard)/tasks');
        return;
      }
      
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
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerLeft}>
        <Text style={[styles.title, { color: colors.text }]}>
          {currentHome ? `${currentHome.name} Calendar` : 'Calendar'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          {calendarLoading || tasksLoading ? 'Loading...' : `${allEvents.length} events`}
        </Text>
        {currentHome && (
          <Text style={[styles.homeName, { color: colors.textSecondary }]}>
            Home-specific events
          </Text>
        )}
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
  if ((calendarLoading || tasksLoading) && !refreshing) {
    return <LoadingState message="Loading calendar..." />;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background, 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom + 20 
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
        title={selectedEvent?.type === 'task' || selectedEvent?.type === 'home_task' ? 'Task Event' : 'Delete Event'}
        message={selectedEvent?.type === 'task' || selectedEvent?.type === 'home_task'
          ? `This is a task event. To manage this task, go to the Tasks section.` 
          : `Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`
        }
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
  homeName: {
    fontSize: 14,
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});