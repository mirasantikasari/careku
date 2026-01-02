import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Home as HomeIcon,
  CalendarDays,
  MessagesSquare,
  BarChart2,
  Settings,
  Utensils,
} from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type NavKey = 'Home' | 'Calendar' | 'Chat' | 'Stats' | 'Food' | 'Settings';

const icons: Record<NavKey, React.ElementType> = {
  Home: HomeIcon,
  Calendar: CalendarDays,
  Chat: MessagesSquare,
  Stats: BarChart2,
  Food: Utensils,
  Settings,
};

const labels: Record<NavKey, string> = {
  Home: 'Home',
  Calendar: 'Calendar',
  Chat: 'AI Chat',
  Stats: 'Stats',
  Food: 'Food',
  Settings: 'Settings',
};

export const BottomNav: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const key = route.name as NavKey;
        const Icon = icons[key];
        const isActive = state.index === index;

        const onPress = () => {
          if (isActive) return;
          navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.9}
            onPress={onPress}
            style={styles.item}>
            <View style={styles.iconWrapper}>
              {isActive ? (
                <LinearGradient
                  colors={['#0e0e0f', '#0073FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconBg}>
                  <Icon size={22} color="#FFFFFF" strokeWidth={2} />
                </LinearGradient>
              ) : (
                <Icon size={22} color="#8A8A8A" strokeWidth={2} />
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {labels[key] ?? route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  labelActive: {
    color: '#0073FF',
  },
});

export default BottomNav;
