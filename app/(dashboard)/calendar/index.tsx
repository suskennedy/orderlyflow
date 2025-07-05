import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

// Define event type
interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  color: string;
  all_day: boolean;
  task_id: string | null;
  [key: string]: any;
}

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
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Helper function to get hex color codes - MOVED TO TOP
  const getColorHex = (color: string): string => {
    switch (color) {
      case 'red': return '#DC2626';
      case 'blue': return '#4F46E5';
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'purple': return '#8B5CF6';
      case 'pink': return '#DB2777';
      default: return '#6B7280';
    }
  };

  // Get the corresponding color for the highlighted date - MOVED TO TOP
  const getEventColor = (colorName: string): string => {
    switch (colorName) {
      case 'red': return '#FECACA'; // Lighter red
      case 'blue': return '#DBEAFE'; // Lighter blue
      case 'green': return '#D1FAE5'; // Lighter green
      case 'yellow': return '#FEF3C7'; // Lighter yellow
      case 'purple': return '#EDE9FE'; // Lighter purple
      case 'pink': return '#FCE7F3'; // Lighter pink
      default: return '#F3F4F6'; // Light gray
    }
  };

  // Fetch calendar events from Supabase
  const fetchEvents = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      Alert.alert('Error', 'Failed to load calendar events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };

  const handleDeletePress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEvent) return;
    
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', selectedEvent.id);
        
      if (error) throw error;
      
      setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));
      setShowDeleteModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  // Enhanced format events for calendar markers - with filled color highlights for event dates
  const markedDates = useMemo(() => {
    const markers: Record<string, MarkingProps> = {};
    
    // Create a map of dates to their respective events
    const eventsByDate: Record<string, CalendarEvent[]> = {};
    
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
        selectedColor: getEventColor(primaryColor),
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
    return events.filter(event => {
      const eventDate = event.start_time.split('T')[0];
      return eventDate === selectedDate;
    }).sort((a, b) => {
      // Sort by start time
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
  }, [events, selectedDate]);

  // Format time for display (12-hour format)
  const formatTime = (isoString: string, allDay: boolean) => {
    if (allDay) return 'All day';
    
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.all_day) return 'All day';
    
    const start = formatTime(event.start_time, false);
    const end = formatTime(event.end_time, false);
    
    return `${start} - ${end}`;
  };

  const getColorStyle = (color: string) => {
    switch (color) {
      case 'red': return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      case 'blue': return { backgroundColor: '#E0E7FF', color: '#4F46E5' };
      case 'green': return { backgroundColor: '#D1FAE5', color: '#10B981' };
      case 'yellow': return { backgroundColor: '#FEF3C7', color: '#F59E0B' };
      case 'purple': return { backgroundColor: '#EDE9FE', color: '#8B5CF6' };
      case 'pink': return { backgroundColor: '#FCE7F3', color: '#DB2777' };
      default: return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const renderEventCard = ({ item: event }: { item: CalendarEvent }) => {
    const colorStyle = getColorStyle(event.color);
    
    return (
      <TouchableOpacity
        style={[styles.eventCard, { borderLeftColor: colorStyle.color }]}
        onPress={() => {
          // Navigate to event details or edit screen
          router.push(`/calendar/edit/${event.id}`);
        }}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleRow}>
            <Text numberOfLines={1} style={styles.eventTitle}>{event.title}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePress(event)}
            >
              <Ionicons name="trash" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
          <Text style={styles.eventTime}>{formatEventTime(event)}</Text>
        </View>
        
        {event.location && (
          <View style={styles.eventInfoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.eventInfoText} numberOfLines={1}>{event.location}</Text>
          </View>
        )}
        
        {event.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
        )}
        
        <View style={[styles.colorTag, { backgroundColor: colorStyle.backgroundColor }]}>
          <Text style={[styles.colorTagText, { color: colorStyle.color }]}>
            {event.task_id ? 'Task Event' : 'Calendar Event'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calendar theme customization
  const calendarTheme = {
    backgroundColor: '#FFFFFF',
    calendarBackground: '#FFFFFF',
    textSectionTitleColor: '#6B7280',
    selectedDayBackgroundColor: '#4F46E5',
    selectedDayTextColor: '#FFFFFF',
    todayTextColor: '#4F46E5',
    dayTextColor: '#111827',
    textDisabledColor: '#D1D5DB',
    dotColor: '#4F46E5',
    selectedDotColor: '#FFFFFF',
    arrowColor: '#4F46E5',
    monthTextColor: '#111827',
    textMonthFontWeight: '600',
    textMonthFontSize: 16,
    textDayFontSize: 14,
    textDayHeaderFontSize: 12,
    'stylesheet.day.basic': {
      base: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
      },
      today: {
        borderWidth: 1,
        borderColor: '#4F46E5',
        borderRadius: 20,
      },
    },
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
      },
      monthText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
      },
    },
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    // Scroll down to show events automatically
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 370, animated: true });
      }, 100);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
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

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            calendarView === 'month' && styles.viewToggleButtonActive
          ]}
          onPress={() => setCalendarView('month')}
        >
          <Ionicons 
            name="calendar" 
            size={18} 
            color={calendarView === 'month' ? '#4F46E5' : '#6B7280'} 
          />
          <Text 
            style={[
              styles.viewToggleText,
              calendarView === 'month' && styles.viewToggleTextActive
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            calendarView === 'agenda' && styles.viewToggleButtonActive
          ]}
          onPress={() => setCalendarView('agenda')}
        >
          <Ionicons 
            name="list" 
            size={18} 
            color={calendarView === 'agenda' ? '#4F46E5' : '#6B7280'} 
          />
          <Text 
            style={[
              styles.viewToggleText,
              calendarView === 'agenda' && styles.viewToggleTextActive
            ]}
          >
            Agenda
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      ) : (
        calendarView === 'month' ? (
          // MONTH VIEW - Now using ScrollView for continuous scrolling
          <ScrollView 
            style={styles.mainScrollView}
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 100}}
          >
            <View style={styles.calendarWrapper}>
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
              <Text style={styles.eventsHeaderTitle}>
                Events for {new Date(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              <View style={styles.eventsHeaderDivider} />
            </View>

            {selectedDateEvents.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noEventsText}>No events scheduled</Text>
                <TouchableOpacity
                  style={styles.addEventButton}
                  onPress={() => router.push('/calendar/add')}
                >
                  <Text style={styles.addEventText}>Add Event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Render events directly in ScrollView instead of using FlatList
              <View style={styles.eventsList}>
                {selectedDateEvents.map(event => (
                  <View key={event.id} style={{marginBottom: 8}}>
                    {renderEventCard({item: event})}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          // AGENDA VIEW
          <FlatList
            data={events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())}
            renderItem={renderEventCard}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
              />
            }
            contentContainerStyle={styles.agendaList}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Events</Text>
                <Text style={styles.emptySubtitle}>
                  Start planning your schedule by adding your first event
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/calendar/add')}
                >
                  <Text style={styles.emptyButtonText}>Add First Event</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      )}

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={styles.modalTitle}>Delete Event</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
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
  mainScrollView: {
    flex: 1,
  },
  calendarWrapper: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  eventsHeaderDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  agendaList: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    marginBottom: 8,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  colorTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  colorTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  noEventsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  addEventButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addEventText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginVertical: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});