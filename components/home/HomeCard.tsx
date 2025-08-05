import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Home, useHomes } from '../../lib/contexts/HomesContext';

import { useTheme } from '../../lib/contexts/ThemeContext';
import { getHomeImageUrl } from '../../lib/utils/imageUtils';
import { routes } from '../../lib/navigation';

interface HomeCardProps {
  home: Home;
}

export default function HomeCard({ home }: HomeCardProps) {
  const { colors } = useTheme();
  const { deleteHome } = useHomes();

  const handleDeleteHome = () => {
    Alert.alert(
      'Delete Home',
      `Are you sure you want to delete "${home.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteHome(home.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete home. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCardPress = () => {
    router.push(routes.home.detail(home.id) as any);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handleCardPress}
    >
      <Image 
        source={{ uri: getHomeImageUrl(home.id, home.image_url, 'small') }} 
        style={styles.image} 
      />
      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: colors.text }]}>{home.name}</Text>
        <Text style={[styles.address, { color: colors.textSecondary }]}>{home.address}</Text>
      </View>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error }]}
        onPress={handleDeleteHome}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash" size={20} color={colors.textInverse} />
      </TouchableOpacity>
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
}); 