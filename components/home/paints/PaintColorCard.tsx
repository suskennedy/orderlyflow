import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { usePaintsStore } from '../../../lib/stores/paintsStore';
import { FONTS } from '../../../lib/typography';

interface PaintColor {
  id: string;
  paint_color_name: string;
  room: string | null;
  finish: string | null;
  wallpaper: boolean | null;
  trim_color: string | null;
  color_code: string | null;
  notes: string | null;
}

interface PaintColorCardProps {
  paint: PaintColor;
}

export default function PaintColorCard({ paint }: PaintColorCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  const deletePaint = usePaintsStore(state => state.deletePaint);

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/paints/${paint.id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete paint color',
      `Remove “${paint.paint_color_name}” from this home?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaint(homeId, paint.id);
            } catch {
              Alert.alert('Error', 'Could not delete this paint color.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerMain}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.colorAndText}>
            <View style={[styles.colorPreview, { backgroundColor: '#ccc' }]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {paint.paint_color_name}
              </Text>
              <Text style={[styles.room, { color: colors.textSecondary }]} numberOfLines={1}>
                {paint.room || 'No room specified'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Delete paint color">
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      {isExpanded && (
        <View style={styles.details}>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Color Code: {paint.color_code || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Trim Color: {paint.trim_color || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Finish: {paint.finish || 'Not specified'}
          </Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            Notes: {paint.notes || 'No notes'}
          </Text>
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary + '15' }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B3010' }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
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
    gap: 8,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  colorAndText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontFamily: FONTS.bodySemiBold,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 