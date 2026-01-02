import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { sharedStyles } from '../theme/styles';

type CardVariant = 'white' | 'gradient';

type CardProps = {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ variant = 'white', style, children }) => {
  const containerStyle = [styles.base, variant === 'gradient' ? styles.gradient : styles.white, style];

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    padding: 14,
    borderRadius: 15,
    ...sharedStyles.shadow,
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    backgroundColor: '#EFF5FF',
  },
});

export default Card;
