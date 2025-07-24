import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

const HEADER_HEIGHT = 250;

export default function   HomeDetailScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { getHomeById } = useHomes();
  const home = getHomeById(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  if (!home) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const menuItems = [
    { title: 'Home Info', icon: 'information-circle-outline' as const, route: `/(home)/${homeId}/info` },
    { title: 'Paint Colors', icon: 'color-palette-outline' as const, route: `/(home)/${homeId}/paints` },
    { title: 'Appliances', icon: 'hardware-chip-outline' as const, route: `/(home)/${homeId}/appliances` },
    { title: 'Warranties', icon: 'shield-checkmark-outline' as const, route: `/(home)/${homeId}/warranties` },
    { title: 'Materials', icon: 'build-outline' as const, route: `/(home)/${homeId}/materials` },
    { title: 'Filters', icon: 'funnel-outline' as const, route: `/(home)/${homeId}/filters` },
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.Image 
          source={{ uri: home.image_url || `https://media.istockphoto.com/id/2170456340/photo/neighborhood-new-homes-sunset-north-carolina-wide-angle.jpg?s=2048x2048&w=is&k=20&c=ULLZi8OEtYh13pF3MO2s3svs1m12IVoaPWTyt7dXVoQ=` }} 
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ marginTop: HEADER_HEIGHT }}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>Edit Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>+ Add Users</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => router.push(item.route as any)}>
                <Ionicons name={item.icon} size={24} color={colors.primary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
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
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: 18,
    marginLeft: 16,
  },
}); 