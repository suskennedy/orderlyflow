import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { usePaints } from '../../../lib/hooks/usePaints';
import ScreenHeader from '../../layouts/layout/ScreenHeader';
import PaintColorCard from './PaintColorCard';

export default function PaintColorsScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { paints, loading } = usePaints(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Paint Colors" 
        showBackButton
        onAddPress={() => router.push(`/(tabs)/(home)/${homeId}/paints/add`)}
      />
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={paints}
          renderItem={({ item }) => <PaintColorCard paint={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.text}]}>No paint colors added yet.</Text>
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