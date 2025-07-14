import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface Stat {
  value: string | number;
  label: string;
  color?: string;
}

interface StatsDisplayProps {
  stats: Stat[];
}

export default function StatsDisplay({ stats }: StatsDisplayProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: stat.color || colors.text }]}>
            {stat.value}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});