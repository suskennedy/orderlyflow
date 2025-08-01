import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { Appliance } from '../../types/database';

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

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{appliance.name}</Text>
          <Text style={[styles.brand, { color: colors.textSecondary }]}>{appliance.brand}</Text>
          {appliance.room && (
            <Text style={[styles.room, { color: colors.textSecondary }]}>Room: {appliance.room}</Text>
          )}
        </View>
        {!onPress && (
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
        )}
        {onPress && (
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        )}
      </View>
      {!onPress && isExpanded && (
        <View style={styles.details}>
          {appliance.model && (
            <Text style={[styles.detailText, { color: colors.text }]}>Model: {appliance.model}</Text>
          )}
          {appliance.purchase_date && (
            <Text style={[styles.detailText, { color: colors.text }]}>Purchased: {appliance.purchase_date}</Text>
          )}
          {appliance.purchased_store && (
            <Text style={[styles.detailText, { color: colors.text }]}>Store: {appliance.purchased_store}</Text>
          )}
          {appliance.warranty_expiration && (
            <Text style={[styles.detailText, { color: colors.text }]}>Warranty: {appliance.warranty_expiration}</Text>
          )}
          {appliance.notes && (
            <Text style={[styles.detailText, { color: colors.text }]}>Notes: {appliance.notes}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
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
  brand: {
    fontSize: 14,
    marginTop: 4,
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
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
}); 