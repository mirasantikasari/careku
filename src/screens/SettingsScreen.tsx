import React, { useEffect, useMemo, useState } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from '../theme/general';
import { Card } from '../ui/Card';
import { CompositeScreenProps } from '@react-navigation/native';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { blue, colors, green, pink } from '../theme/color';
import { Button } from '../ui/Button';
import { LogoutButton } from '../ui/LogoutButton';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ensureConfigured } from '../services/googleSignIn';
import { useAuth } from '../context/AuthContext';
import { clearToken, clearRefreshToken } from '../services/authStorage';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { loadProfile } from '../store/profileSlice';
import { getStoredRefreshToken } from '../services/authStorage';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SettingsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { profile, setProfile } = useAuth();
  const dispatch = useAppDispatch();
  const profileDoc = useAppSelector(state => state.profile.profile);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    getStoredRefreshToken().then(token => {
      setRefreshToken(token);
      if (token && profile?.id) {
        dispatch(loadProfile({ uid: profile.id, refreshToken: token }));
      }
    });
  }, [dispatch, profile?.id]);

  const displayProfile = useMemo(
    () => ({
      name: profileDoc?.name || profile?.name || 'Pengguna',
      email: profileDoc?.email || profile?.email || '-',
      phone: (profile as any)?.phone || '-',
      age: profileDoc?.age
        ? `${profileDoc.age} Tahun`
        : profile?.age
          ? `${profile.age} Tahun`
          : '-',
      joinText: 'Gabung Sejak',
    }),
    [profile],
  );

  const handleNavigate = (screen: keyof TabParamList) => navigation.navigate(screen);
  
  const handleLogout = async () => {
    try {
      ensureConfigured()
      await GoogleSignin.signOut();
      await clearToken();
      await clearRefreshToken();
      await setProfile(null);
      navigation.replace('Login');
    } catch (e) {
      console.error('Gagal logout', e);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.root}>
      <LinearGradient
        colors={['#0e0e0f', '#0073FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSetting}>
        <View style={styles.row}>
          <View style={styles.leftRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.textGroup}>
              <Text style={styles.title}>Profile</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Notifications' as any)}>
            <Feather name="settings" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
          <View style={styles.wrapper}>
            <View style={styles.avatar}>
              <Feather name="user" size={40} color="#0073FF" />
            </View>
            <Text style={styles.name}>{displayProfile.name}</Text>
            <Text style={styles.member}>{displayProfile.joinText}</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.content}>
        <Card variant="white" style={styles.cardShortcuts}>
          <Text>Informasi Personal</Text>
          <View style={{ ...styles.rowCenter, marginTop: 15 }}>
            <View
              style={{...styles.notificationIconContainer, ...colors.bgLightBlue}}>
              <Feather
                name={'mail'}
                size={24}
                color={blue}
              />
            </View>
            <View>
              <Text style={{ ...colors.grey, ...styles.fontSmall }}>Email</Text>
              <Text style={colors.black}>{displayProfile.email}</Text>
            </View>
          </View>
          <View style={{ ...styles.rowCenter, marginTop: 15 }}>
            <View
              style={[
                styles.notificationIconContainer,
                colors.bgPink,
              ]}>
              <Feather
                name={'phone'}
                size={24}
                color={pink}
              />
            </View>
            <View>
              <Text style={{ ...colors.grey, ...styles.fontSmall }}>Nomor Telepon</Text>
              <Text style={colors.black}>{displayProfile.phone}</Text>
            </View>
          </View>
          <View style={{ ...styles.rowCenter, marginVertical: 15 }}>
            <View
              style={[
                styles.notificationIconContainer,
                colors.bgGreen,
              ]}>
              <Feather
                name={'calendar'}
                size={24}
                color={green}
              />
            </View>
            <View>
              <Text style={{ ...colors.grey, ...styles.fontSmall }}>Umur</Text>
              <Text style={colors.black}>{displayProfile.age}</Text>
            </View>
          </View>

        <Button onPress={() => navigation.navigate('ProfileEdit')} variant="outline">
          <Text style={styles.buttonText}>Edit Profil</Text>
        </Button>
        </Card>
        <View style={{ paddingHorizontal: 10, marginTop: 10 }}>
        <LogoutButton onLogout={handleLogout} />
      </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;
