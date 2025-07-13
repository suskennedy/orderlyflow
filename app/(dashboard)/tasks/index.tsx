import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import reusable components
import TaskCard, { Task } from '../../../components/dashboard/TasksCard';
import EmptyState from '../../../components/layout/EmptyState';
import LoadingState from '../../../components/layout/LoadingState';
import ScreenHeader from '../../../components/layout/ScreenHeader';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import StatsDisplay from '../../../components/ui/StatsDisplay';

// Import hooks
import { useTasks } from '../../../lib/contexts/TasksContext';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, updateTask, deleteTask, onRefresh } = useTasks();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Handle delete task
  const handleDeletePress = (task: Task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedTask) {
      try {
        await deleteTask(selectedTask.id);
        setShowDeleteModal(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  // Handle toggle task status
  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Render statistics component
  const renderStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;

    return (
      <StatsDisplay
        stats={[
          { value: totalTasks, label: 'Total Tasks' },
          { value: completedTasks, label: 'Completed', color: '#10B981' },
          { value: pendingTasks, label: 'Pending', color: '#F59E0B' },
          { value: highPriorityTasks, label: 'High Priority', color: '#EF4444' }
        ]}
      />
    );
  };

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading tasks..." />;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
      {/* Header */}
      <ScreenHeader
        title="Tasks"
        subtitle="Manage your to-do list"
        paddingTop={insets.top + 20}
        onAddPress={() => router.push('/tasks/add')}
      />

      <View style={styles.content}>
        {tasks.length === 0 ? (
          <EmptyState
            title="No Tasks Yet"
            message="Add your first task to start managing your home maintenance and projects"
            buttonText="Add Your First Task"
            iconName="checkmark-circle-outline"
            navigateTo="/tasks/add"
          />
        ) : (
          <FlatList
            data={tasks}
            renderItem={({ item }) => (
              <TaskCard
                task={item as Task}
                onDelete={handleDeletePress}
                onToggleStatus={toggleTaskStatus}
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4F46E5']}
              />
            }
            ListHeaderComponent={renderStats}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
});