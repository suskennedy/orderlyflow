import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';

interface PaintColor {
  id: string;
  name: string;
  room: string | null;
  color_hex: string | null;
  brand: string | null;
  color_code?: string | null;
  notes?: string | null;
  finish?: string | null;
}

interface PaintColorCardProps {
  paint: PaintColor;
}

export default function PaintColorCard({ paint }: PaintColorCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/paints/${paint.id}/edit` as any);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.colorAndText}>
          <View style={[styles.colorPreview, { backgroundColor: paint.color_hex || '#ccc' }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.name, { color: colors.text }]}>{paint.name}</Text>
            <Text style={[styles.room, { color: colors.textSecondary }]}>
              {paint.room || 'No room specified'} • {paint.brand || 'No brand'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.details}>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Brand: {paint.brand || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Color Code: {paint.color_code || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Hex Code: {paint.color_hex || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Finish: {paint.finish || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Notes: {paint.notes || 'No notes'}
          </Text>
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
  colorAndText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
}); 