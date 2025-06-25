import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useHomes } from '../../../lib/hooks/useHomes';
import { navigate } from '../../../lib/navigation';
import { supabase } from '../../../lib/supabase';

interface CalendarItem {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  type: 'task' | 'event';
  priority?: string | null;
  status?: string | null;
  all_day?: boolean | null;
  created_at?: string | null;
}

export default function Calendar() {
  const { currentHome } = useHomes();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (currentHome) {
      fetchCalendarData();
    }
  }, [currentHome, currentMonth]);

  const fetchCalendarData = async () => {
    if (!currentHome) return;

    try {
      setLoading(true);
      
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      // Fetch calendar events and tasks with due dates
      const [eventsResult, tasksResult] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .gte('start_time', startDate)
          .lte('start_time', endDate + 'T23:59:59'),
        supabase
          .from('tasks')
          .select('*')
          .eq('home_id', currentHome.id)
          .gte('due_date', startDate)
          .lte('due_date', endDate)
          .neq('status', 'completed')
      ]);

      const events: CalendarItem[] = (eventsResult.data || []).map(event => ({
        id: event.id,
        title: event.title,
        date: event.start_time.split('T')[0],
        time: event.all_day ? undefined : new Date(event.start_time).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: 'event',
        all_day: event.all_day,
      }));

      const tasks: CalendarItem[] = (tasksResult.data || []).map(task => ({
        id: task.id,
        title: task.title,
        date: task.due_date!,
        type: 'task',
        status: task.status,
        priority: task.priority,
      }));

      const allItems = [...events, ...tasks].sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return a.time ? 1 : -1;
      });

      setCalendarItems(allItems);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getItemsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return calendarItems.filter(item => item.date === dateString);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const handleAddEvent = () => {
    navigate.toTasks();
  };

  const handleViewItem = (itemType: string, itemId: string) => {
    if (itemType === 'task') {
      navigate.toTasks();
    } else {
      navigate.toCalendar();
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading calendar..." />;
  }

  const days = getDaysInMonth(currentMonth);
  const selectedDateItems = getItemsForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddEvent}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('prev')}
          >
            <Ionicons name="chevron-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>{formatMonthYear(currentMonth)}</Text>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateMonth('next')}
          >
            <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (!day) {
                return <View key={index} style={styles.emptyDay} />;
              }

              const itemsForDay = getItemsForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDay,
                    isTodayDate && styles.todayDay,
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.selectedDayText,
                    isTodayDate && !isSelected && styles.todayDayText,
                  ]}>
                    {day.getDate()}
                  </Text>
                  {itemsForDay.length > 0 && (
                    <View style={styles.dayIndicator}>
                      <Text style={styles.dayIndicatorText}>{itemsForDay.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Items */}
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>

          {selectedDateItems.length > 0 ? (
            <View style={styles.itemsList}>
              {selectedDateItems.map((item) => (
                <TouchableOpacity 
                  key={`${item.type}-${item.id}`} 
                  style={styles.itemCard}
                  onPress={() => handleViewItem(item.type, item.id)}
                >
                  <View style={styles.itemIcon}>
                    <Ionicons 
                      name={item.type === 'task' ? 'checkbox-outline' : 'calendar-outline'} 
                      size={20} 
                      color={item.type === 'task' ? getPriorityColor(item.priority) : '#4F46E5'} 
                    />
                  </View>
                  
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={styles.itemMeta}>
                      {item.time && (
                        <Text style={styles.itemTime}>{item.time}</Text>
                      )}
                      {item.all_day && (
                        <Text style={styles.itemTime}>All day</Text>
                      )}
                      {item.type === 'task' && item.status && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {item.priority && (
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(item.priority) }
                        ]}>
                          <Text style={styles.priorityText}>
                            {item.priority.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>No events or tasks for this day</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  selectedDay: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  todayDay: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayDayText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedDateSection: {
    marginBottom: 24,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  itemsList: {
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyDayText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
