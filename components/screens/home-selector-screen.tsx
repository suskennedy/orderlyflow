import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

// Home card component - simplified to show just home name and address
const HomeCard = React.memo(({ home, colors }: { home: any; colors: any }) => {
  return (
    <TouchableOpacity
      style={[styles.homeCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/(tabs)/(home)/${home.id}/tasks` as any)}
      activeOpacity={0.7}
    >
      {/* Home Icon and Name */}
      <View style={styles.homeHeader}>
        <View style={[styles.homeIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="home" size={24} color={colors.primary} />
        </View>
        <View style={styles.homeInfo}>
          <Text style={[styles.homeName, { color: colors.text }]} numberOfLines={1}>
            {home.name}
          </Text>
          {home.address && (
            <Text style={[styles.homeAddress, { color: colors.textSecondary }]} numberOfLines={1}>
              {home.address}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
});

// Add display name for the component
HomeCard.displayName = 'HomeCard';

export default function HomeSelectorScreen() {
  const { homes, loading, refreshing, onRefresh } = useHomes();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Debug logging (reduced)
  if (homes.length > 0) {
    console.log('HomeSelectorScreen - homes count:', homes.length);
  }

  // Memoized render function for better performance
  const renderHomeCard = useCallback(({ item: home }: { item: any }) => (
    <HomeCard home={home} colors={colors} />
  ), [colors]);

  // Memoized empty state renderer
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="home-outline" size={80} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Homes Found</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        You need to add homes first before you can manage tasks for them.
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/(home)/add' as any)}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
        <Text style={[styles.addButtonText, { color: colors.textInverse }]}>Add Your First Home</Text>
      </TouchableOpacity>
    </View>
  ), [colors]);

  // Add timeout to prevent stuck loading state
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('HomeSelectorScreen: Loading timeout - this might indicate an issue');
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Select Home</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Choose a home to manage its tasks
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your homes...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Home</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Choose a home to manage its tasks
        </Text>
      </View>

      {homes.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={homes}
          renderItem={renderHomeCard}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 120 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          initialNumToRender={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  list: {
    paddingHorizontal: 20,
  },
  homeCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  homeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  homeInfo: {
    flex: 1,
  },
  homeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  homeAddress: {
    fontSize: 14,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});
