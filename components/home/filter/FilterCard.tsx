import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useFiltersStore } from '../../../lib/stores/filtersStore';
import { FONTS } from '../../../lib/typography';
import { Filter } from '../../../types/database';

interface FilterCardProps {
  filter: Filter;
  onPress?: () => void;
}

export default function FilterCard({ filter, onPress }: FilterCardProps) {
  const { colors } = useTheme();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteFilter = useFiltersStore(state => state.deleteFilter);

  const handleEdit = () => {
    router.push(`/(tabs)/(home)/${homeId}/filters/${filter.id}/edit` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Filter',
      `Remove "${filter.name}" from this home?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFilter(homeId, filter.id);
            } catch {
              Alert.alert('Error', 'Could not delete this filter.');
            }
          },
        },
      ]
    );
  };

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const nextDue = (() => {
    if (!filter.last_replaced || !filter.replacement_frequency) return null;
    try {
      const last = new Date(filter.last_replaced);
      last.setMonth(last.getMonth() + Number(filter.replacement_frequency));
      return last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  })();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLead} onPress={handleCardPress} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="funnel" size={20} color={colors.primary} />
          </View>

          <View style={styles.titleBlock}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{filter.name}</Text>
            <View style={styles.metaRow}>
              {filter.room ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{filter.room}</Text>
                </View>
              ) : null}
              {filter.size ? (
                <View style={styles.metaItem}>
                  <Ionicons name="resize-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{filter.size}</Text>
                </View>
              ) : null}
              {filter.type ? (
                <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{filter.type}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.headerRight}>
            {nextDue && !isExpanded ? (
              <Text style={[styles.dueSoon, { color: colors.textSecondary }]}>{nextDue}</Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerTrash}
          accessibilityLabel="Delete filter"
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCardPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {!onPress && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          )}
          {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
        </TouchableOpacity>
      </View>

      {/* Expanded detail */}
      {!onPress && isExpanded && (
        <View style={[styles.details, { borderTopColor: colors.border }]}>
          {/* Detail rows */}
          <View style={styles.detailGrid}>
            {filter.brand ? (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Brand</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{filter.brand}</Text>
              </View>
            ) : null}
            {filter.model ? (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Model</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{filter.model}</Text>
              </View>
            ) : null}
            {filter.last_replaced ? (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Last Replaced</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {new Date(filter.last_replaced).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            ) : null}
            {filter.replacement_frequency ? (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Replace Every</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{filter.replacement_frequency} months</Text>
              </View>
            ) : null}
            {nextDue ? (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Next Due</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>{nextDue}</Text>
              </View>
            ) : null}
          </View>

          {filter.notes ? (
            <View style={[styles.notesBlock, { backgroundColor: colors.background }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: colors.text }]}>{filter.notes}</Text>
            </View>
          ) : null}

          {/* Edit / Delete actions */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FF3B3012' }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  headerLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  headerTrash: {
    padding: 4,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  dueSoon: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Expanded details
  details: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    minWidth: '44%',
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesBlock: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
