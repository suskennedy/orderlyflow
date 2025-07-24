import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { Paint } from '../../types/database';

interface PaintColorCardProps {
  paint: Paint;
}

export default function PaintColorCard({ paint }: PaintColorCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{paint.name}</Text>
          <Text style={[styles.room, { color: colors.textSecondary }]}>{paint.room}</Text>
        </View>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.details}>
          <View style={[styles.colorPreview, { backgroundColor: paint.color_hex }]} />
          <Text style={[styles.detailText, { color: colors.text }]}>Brand: {paint.brand}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Finish: {paint.finish}</Text>
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
  room: {
    fontSize: 14,
    marginTop: 4,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
}); 