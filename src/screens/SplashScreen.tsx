import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import { getStoredToken } from '../services/authStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await getStoredToken();
        navigation.replace(token ? 'Main' : 'Login');
      } catch (e) {
        navigation.replace('Login');
      }
    };

    bootstrap();
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#0e0e0f', '#0073FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      <Image
        source={require('../assets/splash.png')}
        style={styles.logo}
        width={80}
        resizeMode="contain"
      />
      <Text style={styles.title}>CareKu</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffffff',
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
  },
});

export default SplashScreen;
