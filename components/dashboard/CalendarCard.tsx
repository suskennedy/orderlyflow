import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router } from 'expo-router';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { CalendarEvent } from '../../types/database';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onDelete: (event: CalendarEvent) => void;
}

function CalendarEventCard({ 
  event, 
  onDelete 
}: CalendarEventCardProps) {
  const { colors } = useTheme();
  
  // Helper function for color styles
  const getColorStyle = (color: string) => {
    switch (color) {
      case 'red': return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      case 'orange': return { backgroundColor: '#FEF3C7', color: '#F59E0B' };
      case 'blue': return { backgroundColor: '#E0E7FF', color: '#4F46E5' };
      case 'green': return { backgroundColor: '#D1FAE5', color: '#10B981' };
      case 'yellow': return { backgroundColor: '#FEF3C7', color: '#F59E0B' };
      case 'purple': return { backgroundColor: '#EDE9FE', color: '#8B5CF6' };
      case 'pink': return { backgroundColor: '#FCE7F3', color: '#DB2777' };
      default: return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

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

  const colorStyle = getColorStyle(event.color as string);
  const isTaskEvent = event.task_id !== null;
  const isRecurring = event.is_recurring || event.title.includes('(Recurring)');

  return (
    <TouchableOpacity
      style={[styles.card, { 
        backgroundColor: colors.surface,
        borderLeftColor: colorStyle.color 
      }]}
      onPress={() => router.push(`/calendar/edit/${event.id}` as RelativePathString)}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            {isTaskEvent && (
              <View style={[styles.taskIcon, { backgroundColor: colorStyle.backgroundColor }]}>
                <Ionicons name="checkmark-circle" size={14} color={colorStyle.color} />
              </View>
            )}
            {isRecurring && (
              <View style={[styles.recurringIcon, { backgroundColor: colorStyle.backgroundColor }]}>
                <Ionicons name="repeat" size={14} color={colorStyle.color} />
              </View>
            )}
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{event.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(event)}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.time, { color: colors.textTertiary }]}>{formatEventTime(event)}</Text>
      </View>
      
      {event.location && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.infoText, { color: colors.textTertiary }]} numberOfLines={1}>{event.location}</Text>
        </View>
      )}
      
      {event.description && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {event.description}
        </Text>
      )}
      
      <View style={[styles.tag, { backgroundColor: colorStyle.backgroundColor }]}>
        <Text style={[styles.tagText, { color: colorStyle.color }]}>
          {isRecurring ? 'Recurring Task' : isTaskEvent ? 'Task Event' : 'Calendar Event'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 8,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  recurringIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 14,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
  },
});

export default memo(CalendarEventCard);