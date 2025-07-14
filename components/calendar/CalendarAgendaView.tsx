import React, { memo } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useCalendar } from '../../lib/contexts/CalendarContext';
import { CalendarEvent } from '../../types/database';
import CalendarEventCard from '../dashboard/CalendarCard';
import EmptyState from '../layout/EmptyState';

interface CalendarAgendaViewProps {
  refreshing: boolean;
  onRefresh: () => void;
  onDeletePress: (event: CalendarEvent) => void;
}

// Use React.memo for performance optimization
const CalendarAgendaView = memo(({
  refreshing,
  onRefresh,
  onDeletePress,
}: CalendarAgendaViewProps) => {
  const { getAgendaEvents } = useCalendar();
  
  // Get processed events for agenda view (grouped recurring tasks)
  const agendaEvents = getAgendaEvents();

  return (
    <FlatList
      data={agendaEvents}
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