import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Card } from '../ui/Card';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import ProgressCard from '../ui/ProgressCard';
import ProgressMin from '../ui/ProgressMin';
import { Button } from '../ui/Button';
import { styles } from '../theme/general';
import { colors } from '../theme/color';
import { useAuth } from '../context/AuthContext';
import { getStoredRefreshToken } from '../services/authStorage';
import { getHomeData, updateHomeData } from '../services/homeData';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

type ShortcutItem = {
  icon: string;
  label: string;
  screen: keyof TabParamList;
  color: string;
  bgColor: string;
};

type NotificationItem = {
  icon: string;
  message: string;
  color: string;
  bgColor: string;
};

const feelOptions = [
  { id: 'happy', emoji: '😊' },
  { id: 'calm', emoji: '😌' },
  { id: 'neutral', emoji: '😐' },
  { id: 'sad', emoji: '😔' },
  { id: 'frustrated', emoji: '😤' },
];

const HomeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { profile } = useAuth();

  const [selectedFeel, setSelectedFeel] = useState<string | null>(null);
  const [water, setWater] = useState<number>(0);
  const [painLevel, setPainLevel] = useState<number>(0);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const maxWater = 8;
  const maxPain = 10;

  useEffect(() => {
    const load = async () => {
      const token = await getStoredRefreshToken();
      setRefreshToken(token);
      if (!token || !profile?.id) return;
      try {
        const data = await getHomeData(profile.id, token);
        if (data.mood) {
          setSelectedFeel(data.mood);
        }
        if (typeof data.waterIntake === 'number') {
          setWater(data.waterIntake);
        }
        if (typeof data.painLevel === 'number') {
          setPainLevel(data.painLevel);
        }
      } catch (err) {
        console.log('Load home data failed', err);
      }
    };
    load();
  }, [profile?.id]);

  const notifications: NotificationItem[] = [
    {
      icon: 'activity',
      message: 'Belum olahraga hari ini? Yuk gerak 10 menit ya!',
      color: '#4DA6FF',
      bgColor: 'rgba(77, 166, 255, 0.15)',
    },
    {
      icon: 'edit-3',
      message: 'Isi cerita harimu biar AI bisa bantu ya.',
      color: '#FFC1E3',
      bgColor: 'rgba(255, 193, 227, 0.2)',
    },
  ];

  const shortcuts: ShortcutItem[] = [
    {
      icon: 'message-circle',
      label: 'AI Chat',
      screen: 'Chat',
      color: '#FFC1E3',
      bgColor: 'rgba(255, 193, 227, 0.25)',
    },
    {
      icon: 'book',
      label: 'Food Guide',
      screen: 'Food',
      color: '#4DA6FF',
      bgColor: 'rgba(77, 166, 255, 0.15)',
    },
    {
      icon: 'calendar',
      label: 'Calendar',
      screen: 'Calendar',
      color: '#0073FF',
      bgColor: 'rgba(249, 51, 37, 0.15)',
    },
    {
      icon: 'star',
      label: 'Stats',
      screen: 'Stats',
      color: '#FFC1E3',
      bgColor: 'rgba(255, 193, 227, 0.25)',
    },
  ];

  const displayName = 'Cantik';

  const handleNavigate = (screen: keyof TabParamList) => navigation.navigate(screen);

  const handleSelectFeel = async (item: { id: string }) => {
    setSelectedFeel(item.id);
    if (!profile?.id || !refreshToken) return;
    try {
      await updateHomeData(profile.id, refreshToken, { mood: item.id });
    } catch (err) {
      console.log('Failed to save mood', err);
    }
  };

  const handleAddWater = async () => {
    const next = Math.min(maxWater, water + 1);
    setWater(next);
    if (!profile?.id || !refreshToken) return;
    try {
      await updateHomeData(profile.id, refreshToken, { waterIntake: next });
    } catch (err) {
      console.log('Failed to save water intake', err);
    }
  };

  const handlePainChange = async (delta: number) => {
    const next = Math.max(0, Math.min(maxPain, painLevel + delta));
    setPainLevel(next);
    if (!profile?.id || !refreshToken) return;
    try {
      await updateHomeData(profile.id, refreshToken, { painLevel: next });
    } catch (err) {
      console.log('Failed to save pain level', err);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.root}>
      <LinearGradient
        colors={['#0e0e0f', '#0073FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerGreeting}>Hai</Text>
            <Text style={styles.headerName}>{profile?.name || displayName}</Text>
            <Text style={styles.headerTitle}>How are you feeling today?</Text>
          </View>

          <TouchableOpacity
            style={styles.notifButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications' as any)}>
            <Feather name="bell" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card variant="white" style={styles.cardShortcuts}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <Text>Suasana Hati Hari Ini</Text>
            <Text>{selectedFeel ? 'Tersimpan' : ''}</Text>
          </View>
          <View style={styles.shortcutsGrid}>
            {feelOptions.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => handleSelectFeel(item)}
                style={{
                  ...styles.feelButton,
                  backgroundColor: `${selectedFeel === item.id ? '#d5eafeff' : '#ffffff'}`,
                }}>
                <View style={[styles.shortcutIconContainer]}>
                  <Text style={styles.feelText}>{item.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ marginTop: 15 }}>
            <ProgressCard title="Tingkat Nyeri" value={painLevel} max={maxPain} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => handlePainChange(-1)} style={localStyles.iconButton}>
                <Feather name="minus-circle" size={18} color="#0d5da7ff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePainChange(1)} style={localStyles.iconButton}>
                <Feather name="plus-circle" size={18} color="#0d5da7ff" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <Card variant="white" style={styles.cardShortcuts}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <View style={styles.rowCenter}>
              <View
                style={[
                  styles.notificationIconContainer,
                  { backgroundColor: '#d5eafeff' },
                ]}>
                <Feather
                  name={'droplet'}
                  size={24}
                  color={'#0d5da7ff'}
                />
              </View>
              <View>
                <Text style={colors.black}>Konsumsi Air</Text>
                <Text style={colors.grey}>{water} / {maxWater} gelas hari ini</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleAddWater}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 5, paddingHorizontal: 10, backgroundColor: '#0d5da7ff', borderRadius: 15 }}>
              <Feather
                  name={'plus-circle'}
                  size={14}
                  color={'#ffffff'}
                />
                <Text style={{ marginLeft: 5, color: '#ffffff' }}>Add</Text>
            </TouchableOpacity>
          </View>
          <ProgressMin current={water} max={maxWater} />
        </Card>

        <View style={{ marginBottom: 10 }}>
          <Text>Menu Cepat</Text>
        </View>

        <Card variant="white" style={styles.cardShortcuts}>
          <View style={styles.shortcutsGrid}>
            {shortcuts.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => handleNavigate(item.screen)}
                style={styles.shortcutButton}>
                <View
                  style={[
                    styles.shortcutIconContainer,
                    { backgroundColor: item.bgColor },
                  ]}>
                  <Feather name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.shortcutLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.notificationsWrapper}>
          {notifications.map((notif, idx) => (
            <Card key={idx} variant="gradient" style={styles.notificationCard}>
              <View
                style={[
                  styles.notificationIconContainer,
                  { backgroundColor: notif.bgColor },
                ]}>
                <Feather
                  name={notif.icon as any}
                  size={24}
                  color={notif.color}
                />
              </View>
              <Text style={styles.notificationText}>{notif.message}</Text>
            </Card>
          ))}
        </View>

        <View style={styles.quickActionWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Diary' as any)}>
              <LinearGradient
              colors={['#000000ff', '#0073FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickActionButton}>
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionTextWrapper}>
                  <Text style={styles.quickActionTitle}>Cerita Hari Ini</Text>
                  <Text style={styles.quickActionSubtitle}>
                    Bagikan aktivitas harianmu hari ini
                  </Text>
                </View>
                <Feather name="edit-3" size={30} color="#FFFFFF" />
              </View>
              </LinearGradient>
          </TouchableOpacity>
        </View>
        

        <Card variant="gradient" style={styles.cardTips}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
            
            {/* ICON */}
            <View
              style={[
                styles.notificationIconContainer,
                { backgroundColor: '#e02a91ff', marginRight: 12 },
              ]}
            >
              <Feather name="heart" size={22} color="#ffffff" />
            </View>

            {/* TEXT */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: 'black',
                  fontWeight: '600',
                  marginBottom: 2,
                }}
              >
                Tips Dari Careku Hari Ini
              </Text>

              <Text
                style={{
                  color: '#666',
                  flexWrap: 'wrap',
                }}
              >
                Try adding more leafy greens to your diet today. They're great for
                reducing inflammation!
              </Text>
            </View>

          </View>
          <Button onPress={() => handleNavigate('Chat')} variant="outline" fullWidth>
            <Text>Tanya Careku</Text>
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  iconButton: {
    marginLeft: 10,
  },
});

export default HomeScreen;
