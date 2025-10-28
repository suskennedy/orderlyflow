import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { Appliance } from '../../../types/database';

interface ApplianceCardProps {
  appliance: Appliance;
  onPress?: () => void;
}

export default function ApplianceCard({ appliance, onPress }: ApplianceCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const getStatusColor = () => {
    if (appliance.warranty_expiration) {
      const warrantyDate = new Date(appliance.warranty_expiration);
      const today = new Date();
      if (warrantyDate > today) {
        return '#10B981'; // Green for active warranty
      }
    }
    return colors.textSecondary;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="hardware-chip" size={20} color={colors.primary} />
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.name, { color: colors.text }]}>{appliance.name}</Text>
            {appliance.brand && (
              <Text style={[styles.brand, { color: colors.textSecondary }]}>
                {appliance.brand}
              </Text>
            )}
           
          </View>
        </View>
        
        <View style={styles.rightContent}>
          {appliance.warranty_expiration && (
            <View style={[styles.warrantyBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={12} color={getStatusColor()} />
              <Text style={[styles.warrantyText, { color: getStatusColor() }]}>
                Warranty
              </Text>
            </View>
          )}
          {onPress ? (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          ) : (
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
          )}
        </View>
      </View>
      
      {!onPress && isExpanded && (
        <View style={styles.details}>
          {appliance.model && (
            <View style={styles.detailRow}>
              <Ionicons name="settings" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Model: {appliance.model}
              </Text>
            </View>
          )}
          {appliance.purchase_date && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Purchased: {new Date(appliance.purchase_date).toLocaleDateString()}
              </Text>
            </View>
          )}
          {appliance.warranty_expiration && (
            <View style={styles.detailRow}>
              <Ionicons name="shield" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Warranty: {new Date(appliance.warranty_expiration).toLocaleDateString()}
              </Text>
            </View>
          )}
          {appliance.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Notes: {appliance.notes}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
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
  brand: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  roomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  room: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 8,
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  warrantyText: {
    fontSize: 10,
    fontWeight: '600',
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