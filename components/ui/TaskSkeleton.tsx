import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    View,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface TaskSkeletonProps {
  count?: number;
}

export default function TaskSkeleton({ count = 5 }: TaskSkeletonProps) {
  const { colors } = useTheme();
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerValue]);

  const shimmerOpacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderSkeletonItem = (index: number) => (
    <View 
      key={index} 
      style={[
        styles.skeletonCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }
      ]}
    >
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLeft}>
          {/* Icon placeholder */}
          <Animated.View
            style={[
              styles.skeletonIcon,
              {
                backgroundColor: colors.border,
                opacity: shimmerOpacity,
              }
            ]}
          />
          
          <View style={styles.skeletonText}>
            {/* Title placeholder */}
            <Animated.View
              style={[
                styles.skeletonTitle,
                {
                  backgroundColor: colors.border,
                  opacity: shimmerOpacity,
                }
              ]}
            />
            
            {/* Category placeholder */}
            <Animated.View
              style={[
                styles.skeletonCategory,
                {
                  backgroundColor: colors.border,
                  opacity: shimmerOpacity,
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.skeletonRight}>
          {/* Date pill placeholder */}
          <Animated.View
            style={[
              styles.skeletonDate,
              {
                backgroundColor: colors.border,
                opacity: shimmerOpacity,
              }
            ]}
          />
          
          {/* Complete button placeholder */}
          <Animated.View
            style={[
              styles.skeletonButton,
              {
                backgroundColor: colors.border,
                opacity: shimmerOpacity,
              }
            ]}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonItem(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  skeletonCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 8,
    marginBottom: 6,
    width: '70%',
  },
  skeletonCategory: {
    height: 12,
    borderRadius: 6,
    width: '50%',
  },
  skeletonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonDate: {
    width: 80,
    height: 28,
    borderRadius: 14,
  },
  skeletonButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
