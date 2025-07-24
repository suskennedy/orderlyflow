import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { Appliance } from '../../types/database';

interface ApplianceCardProps {
  appliance: Appliance;
}

export default function ApplianceCard({ appliance }: ApplianceCardProps) {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{appliance.name}</Text>
          <Text style={[styles.brand, { color: colors.textSecondary }]}>{appliance.brand}</Text>
        </View>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.details}>
          <Text style={[styles.detailText, { color: colors.text }]}>Model: {appliance.model}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Purchased: {appliance.purchase_date}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Store: {appliance.purchased_store}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Warranty Length: {appliance.warranty_length}</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>Notes: {appliance.notes}</Text>
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
  brand: {
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