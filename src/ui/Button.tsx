import React, { ReactNode, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface ButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'gradient' | 'pink' | 'blue' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'gradient',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
}) => {
  // Animation for press effect
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const sizes = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16 },
  };

  const selectedSize = sizes[size];

  // COLORS by variant
  const variantStyle = (() => {
    switch (variant) {
      case 'pink':
        return {
          type: 'solid',
          backgroundColor: '#FFC1E3',
          textColor: '#FFFFFF',
        };
      case 'blue':
        return {
          type: 'solid',
          backgroundColor: '#0073FF',
          textColor: '#FFFFFF',
        };
      case 'outline':
        return {
          type: 'outline',
          borderColor: '#FFC1E3',
          textColor: '#0073FF',
        };
      case 'gradient':
      default:
        return {
          type: 'gradient',
          gradientColors: ['#0e0e0f', '#0073FF'],
          textColor: '#FFFFFF',
        };
    }
  })();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : undefined }}>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={onPress}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
        style={[
          styles.buttonWrapper,
          fullWidth && { width: '100%' },
          variantStyle.type === 'solid' && { backgroundColor: variantStyle.backgroundColor },
          variantStyle.type === 'outline' && {
            borderWidth: 2,
            borderColor: variantStyle.borderColor,
            backgroundColor: '#FFFFFF',
          },
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {/* Gradient Fill */}
        {variantStyle.type === 'gradient' && (
          <LinearGradient
            colors={variantStyle.gradientColors!}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: 999 },
            ]}
          />
        )}

        <View style={styles.contentContainer}>
          {typeof children === 'string' ? (
            <Text
              style={{
                fontSize: selectedSize.fontSize,
                color: variantStyle.textColor,
                fontWeight: '600',
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
