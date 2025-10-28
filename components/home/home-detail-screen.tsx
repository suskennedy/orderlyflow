import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { getHomeImageUrl } from '../../lib/utils/imageUtils';

const HEADER_HEIGHT = 250;

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
  count?: number;
}

export default function HomeDetailScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { getHomeById } = useHomes();
  const home = getHomeById(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  if (!home) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const menuItems: MenuItem[] = [
    { 
      title: 'Home Info', 
      icon: 'information-circle-outline', 
      route: `/(home)/${homeId}/info`,
      description: 'View and edit home details'
    },
    { 
      title: 'Paint Colors', 
      icon: 'color-palette-outline', 
      route: `/(home)/${homeId}/paints`,
      description: 'Manage paint colors for each room'
    },
    { 
      title: 'Appliances', 
      icon: 'hardware-chip-outline', 
      route: `/(home)/${homeId}/appliances`,
      description: 'Track appliances and maintenance'
    },
    { 
      title: 'Warranties', 
      icon: 'shield-checkmark-outline', 
      route: `/(home)/${homeId}/warranties`,
      description: 'Manage warranty information'
    },
    { 
      title: 'Materials', 
      icon: 'build-outline', 
      route: `/(home)/${homeId}/materials`,
      description: 'Track materials and finishes'
    },
    { 
      title: 'Filters', 
      icon: 'funnel-outline', 
      route: `/(home)/${homeId}/filters`,
      description: 'Manage air and water filters'
    },
  ];

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
  };

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const handleEditHome = () => {
    // Navigate to edit home screen
    router.push(`/(tabs)/(home)/${homeId}/edit` as any);
  };

  const handleAddUsers = () => {
    // Navigate to family management screen
    router.push('/(tabs)/(settings)/family-management' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.Image 
          source={{ uri: getHomeImageUrl(home.id, home.image_url, 'large') }} 
          style={[styles.image, { opacity: imageOpacity }]} 
        />
      </Animated.View>

      <Animated.View style={[styles.topHeader, { paddingTop: insets.top, opacity: headerOpacity, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topHeaderText, { color: colors.text }]}>{home.name}</Text>
      </Animated.View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={{ marginTop: HEADER_HEIGHT }}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleEditHome}
            >
              <Ionicons name="create-outline" size={20} color={colors.textInverse} />
              <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>Edit Home</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={handleAddUsers}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.textInverse} />
              <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>Add Users</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Home Information</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]} numberOfLines={2}>
                  {home.address || 'Address not set'}
                </Text>
              </View>
              {home.bedrooms && home.bathrooms && (
                <View style={styles.infoRow}>
                  <Ionicons name="bed-outline" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {home.bedrooms} bed, {home.bathrooms} bath
                  </Text>
                </View>
              )}
              {home.square_footage && (
                <View style={styles.infoRow}>
                  <Ionicons name="resize-outline" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {home.square_footage} sq ft
                  </Text>
                </View>
              )}
              {home.year_built && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    Built in {home.year_built}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.menuContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage Your Home</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.menuItem, { borderBottomColor: colors.border }]} 
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 16,
  },
  topHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
  },
}); 