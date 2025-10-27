import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { Filter } from '../../types/database';

interface FilterCardProps {
  filter: Filter;
  onPress?: () => void;
}

export default function FilterCard({ filter, onPress }: FilterCardProps) {
  const { colors } = useTheme();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(home)/${homeId}/filters/${filter.id}`);
    }
  };

  const handleExpandPress = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={handleCardPress}>
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="funnel" size={20} color={colors.primary} />
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.name, { color: colors.text }]}>{filter.name}</Text>
            <Text style={[styles.room, { color: colors.textSecondary }]}>{filter.room}</Text>
            {filter.size && (
              <Text style={[styles.size, { color: colors.textSecondary }]}>Size: {filter.size}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.rightContent}>
          {onPress ? (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          ) : (
            <TouchableOpacity onPress={handleExpandPress}>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      
      {!onPress && isExpanded && (
        <View style={styles.details}>
          {filter.brand && (
            <View style={styles.detailRow}>
              <Ionicons name="business" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Brand: {filter.brand}
              </Text>
            </View>
          )}
          {filter.last_replaced && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Last Replaced: {new Date(filter.last_replaced).toLocaleDateString()}
              </Text>
            </View>
          )}
          {filter.replacement_frequency && (
            <View style={styles.detailRow}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Replace Every: {filter.replacement_frequency} months
              </Text>
            </View>
          )}
          {filter.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Notes: {filter.notes}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  room: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  size: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
}); 