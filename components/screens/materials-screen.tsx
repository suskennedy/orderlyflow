import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMaterials } from '../../lib/contexts/MaterialsContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import MaterialCard from '../home/MaterialCard';
import ScreenHeader from '../layout/ScreenHeader';

export default function MaterialsScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { materials, loading } = useMaterials(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Materials" 
        showBackButton
        onAddPress={() => router.push(`/(tabs)/(home)/${homeId}/materials/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={materials}
          renderItem={({ item }) => <MaterialCard material={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No materials added yet.</Text>
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