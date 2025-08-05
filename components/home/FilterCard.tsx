import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { Filter } from '../../types/database';

interface FilterCardProps {
  filter: Filter;
}

export default function FilterCard({ filter }: FilterCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{filter.name}</Text>
          <Text style={[styles.size, { color: colors.textSecondary }]}>{filter.size}</Text>
        </View>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.details}>
          <Text style={[styles.detailText, { color: colors.text }]}>Brand: {filter.brand}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Last Changed: {filter.last_replaced}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Notes: {filter.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  size: {
    fontSize: 14,
    marginTop: 4,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
}); 