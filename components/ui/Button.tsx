import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [
          ...baseStyle,
          {
            backgroundColor: disabled ? colors.textTertiary : colors.primary,
            borderColor: disabled ? colors.textTertiary : colors.primary,
          }
        ];
      case 'secondary':
        return [
          ...baseStyle,
          {
            backgroundColor: disabled ? colors.surfaceVariant : colors.secondary,
            borderColor: disabled ? colors.surfaceVariant : colors.secondary,
          }
        ];
      case 'outline':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderColor: disabled ? colors.textTertiary : colors.primary,
          }
        ];
      case 'ghost':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          }
        ];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return [...baseStyle, { color: colors.textInverse }];
      case 'outline':
        return [...baseStyle, { color: disabled ? colors.textTertiary : colors.primary }];
      case 'ghost':
        return [...baseStyle, { color: disabled ? colors.textTertiary : colors.primary }];
      default:
        return baseStyle;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.textInverse;
      case 'outline':
      case 'ghost':
        return disabled ? colors.textTertiary : colors.primary;
      default:
        return colors.textInverse;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? colors.textInverse : colors.primary} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={getIconColor()} 
              style={styles.leftIcon}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={getIconColor()} 
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
}); 