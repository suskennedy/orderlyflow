import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFilters } from '../../lib/contexts/FiltersContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import FilterCard from '../home/FilterCard';
import ScreenHeader from '../layout/ScreenHeader';

export default function FiltersScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { filters, loading } = useFilters(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Filters" 
        showBackButton
        onAddPress={() => router.push(`/(home)/${homeId}/filters/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filters}
          renderItem={({ item }) => <FilterCard filter={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No filters added yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
  }
}); 