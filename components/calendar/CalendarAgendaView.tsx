import React, { memo } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import CalendarEventCard from '../dashboard/CalendarCard';
import EmptyState from '../layout/EmptyState';

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

interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  refreshing: boolean;
  onRefresh: () => void;
  onDeletePress: (event: CalendarEvent) => void;
}

// Use React.memo for performance optimization
const CalendarAgendaView = memo(({
  events,
  refreshing,
  onRefresh,
  onDeletePress,
}: CalendarAgendaViewProps) => {
  // Sort events by start time
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <FlatList
      data={sortedEvents}
      renderItem={({ item }) => (
        <CalendarEventCard event={item} onDelete={onDeletePress} />
      )}
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
        <EmptyState
          title="No Events"
          message="Start planning your schedule by adding your first event"
          buttonText="Add First Event"
          iconName="calendar-outline"
          navigateTo="/calendar/add"
        />
      )}
    />
  );
});

const styles = StyleSheet.create({
  agendaList: {
    padding: 16,
    paddingBottom: 100,
  },
});

export default CalendarAgendaView;