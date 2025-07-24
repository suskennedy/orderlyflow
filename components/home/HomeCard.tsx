import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Home } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface HomeCardProps {
  home: Home;
}

export default function HomeCard({ home }: HomeCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/(home)/${home.id}` as any)}
    >
      <Image 
        source={{ uri: home.image_url || `https://media.istockphoto.com/id/2170456340/photo/neighborhood-new-homes-sunset-north-carolina-wide-angle.jpg?s=2048x2048&w=is&k=20&c=ULLZi8OEtYh13pF3MO2s3svs1m12IVoaPWTyt7dXVoQ=` }} 
        style={styles.image} 
      />
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]}>{home.name}</Text>
        <Text style={[styles.address, { color: colors.textSecondary }]}>{home.address}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    marginTop: 4,
  },
}); 