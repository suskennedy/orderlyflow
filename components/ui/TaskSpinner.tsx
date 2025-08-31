import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface TaskSpinnerProps {
  visible: boolean;
  message?: string;
  type?: 'saving' | 'loading' | 'processing';
}

export default function TaskSpinner({ 
  visible, 
  message = 'Processing...', 
  type = 'saving' 
}: TaskSpinnerProps) {
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start spinning animation
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();

      return () => {
        spin.stop();
      };
    } else {
      // Hide animations
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, spinValue, scaleValue, opacityValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIcon = () => {
    switch (type) {
      case 'saving':
        return 'save';
      case 'loading':
        return 'refresh';
      case 'processing':
        return 'cog';
      default:
        return 'refresh';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'saving':
        return colors.success;
      case 'loading':
        return colors.primary;
      case 'processing':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: opacityValue,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale: scaleValue }],
            }
          ]}
        >
          {/* Spinner Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: getColor() + '20',
                transform: [{ rotate: spin }],
              }
            ]}
          >
            <Ionicons 
              name={getIcon()} 
              size={32} 
              color={getColor()} 
            />
          </Animated.View>

          {/* Message */}
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: getColor(),
                    opacity: opacityValue,
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    minWidth: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
