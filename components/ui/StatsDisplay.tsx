import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface StatItem {
  value: string | number;
  label: string;
  color?: string;
}

interface StatsDisplayProps {
  stats: StatItem[];
  containerStyle?: object;
}

export default function StatsDisplay({
  stats,
  containerStyle,
}: StatsDisplayProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <Text 
            style={[
              styles.statValue, 
              stat.color ? { color: stat.color } : null
            ]}
          >
            {stat.value}
          </Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});