import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface CalendarEventCardProps {
  event: CalendarEvent;
  onDelete: (event: CalendarEvent) => void;
}

export default function CalendarEventCard({ 
  event, 
  onDelete 
}: CalendarEventCardProps) {
  // Helper function for color styles
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

  const colorStyle = getColorStyle(event.color);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: colorStyle.color }]}
      onPress={() => router.push(`/calendar/edit/${event.id}`)}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{event.title}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(event)}
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <Text style={styles.time}>{formatEventTime(event)}</Text>
      </View>
      
      {event.location && (
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
        </View>
      )}
      
      {event.description && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}
      
      <View style={[styles.tag, { backgroundColor: colorStyle.backgroundColor }]}>
        <Text style={[styles.tagText, { color: colorStyle.color }]}>
          {event.task_id ? 'Task Event' : 'Calendar Event'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
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