import { Search } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightSlot,
  colors = ['#0e0e0f', '#0073FF'],
  style,
}) => {
  const gradientColors = colors.length === 1 ? [colors[0], colors[0]] : colors;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, style]}>
      <View style={styles.row}>
        <View style={styles.leftRow}>
          {onBack && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onBack}
              style={styles.backButton}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.textGroup}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          
        </View>
        {rightSlot}
      </View>
      {
        !subtitle &&
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 10, marginTop: 10 }}>
          <Search size={20} color="#8A8A8A" />
          <TextInput
            style={{ flex: 1, paddingVertical: 8, width: '100%', borderColor:'red' }}
            placeholder="Cari makanan atau aktivitas..."
          />
        </View>
      }
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  textGroup: {
    flexDirection: 'column',
  },
});

export default ScreenHeader;
