import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type ProgressRingColor = 'pink' | 'blue' | 'gradient';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  value?: string;
  color?: ProgressRingColor;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  label,
  value,
  color = 'gradient',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.max(0, Math.min(progress, 100)), // clamp 0–100
      duration: 800,
      useNativeDriver: false, // karena animasi strokeDashoffset (bukan transform)
    }).start();
  }, [progress, animatedValue]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0], // 0% = kosong, 100% = penuh
  });

  const getStrokeColor = (): string => {
    switch (color) {
      case 'pink':
        return '#FFC1E3';
      case 'blue':
        return '#4DA6FF';
      case 'gradient':
      default:
        // gradient pakai id di <Defs>
        return 'url(#progressGradient)';
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Defs>
            <LinearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#FFC1E3" />
              <Stop offset="100%" stopColor="#4DA6FF" />
            </LinearGradient>
          </Defs>

          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F5F5F5"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle (animated) */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            fill="none"
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerContent}>
          <Text style={styles.progressText}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      {label && (
        <View style={styles.labelWrapper}>
          <Text style={styles.label}>{label}</Text>
          {value ? <Text style={styles.value}>{value}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  } as any, // React Native belum kenal 'inset', bisa diganti top/left/right/bottom: 0
  progressText: {
    color: '#ffffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  labelWrapper: {
    marginTop: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#ffffffff',
  },
  value: {
    fontSize: 13,
    color: '#ffffffff',
    marginTop: 2,
  },
});
