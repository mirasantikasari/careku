import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Button } from '../ui/Button';
import { signInWithEmail, signInWithGoogleIdToken } from '../services/firebaseAuth';
import { storeToken, getStoredToken, storeRefreshToken } from '../services/authStorage';
import { signInWithGoogleToken } from '../services/googleSignIn';
import { isBiometricAvailable, verifyBiometric } from '../services/biometricAuth';
import { Fingerprint } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [hasBio, setHasBio] = useState(false);
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const { setProfile } = useAuth();

  useEffect(() => {
    const bootstrap = async () => {
      const token = await getStoredToken();
      setSavedToken(token);
      const available = await isBiometricAvailable();
      setHasBio(available);
    };
    bootstrap();
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const res = await signInWithEmail(email.trim(), password);
      await storeToken(res.idToken);
      await storeRefreshToken(res.refreshToken);
      await setProfile({
        id: res.localId,
        email: email.trim(),
      });
      navigation.replace('Main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setError(null);

    try {
      setGoogleLoading(true);
      const { idToken, profile } = await signInWithGoogleToken();
      const res = await signInWithGoogleIdToken(idToken);
      await setProfile({
        ...profile,
        id: res.localId,
      });
      await storeToken(res.idToken);
      await storeRefreshToken(res.refreshToken);
      navigation.replace('Main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBiometric = async () => {
    if (bioLoading) return;
    setError(null);

    try {
      if (!savedToken) {
        setError('Belum ada sesi tersimpan. Login dulu dengan email atau Google.');
        return;
      }
      setBioLoading(true);
      const ok = await verifyBiometric('Gunakan biometrik untuk masuk');
      if (!ok) {
        setError('Verifikasi biometrik dibatalkan.');
        return;
      }
      await storeToken(savedToken);
      navigation.replace('Main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometrik gagal.');
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0e0e0f', '#0073FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.subtitle}>Selamat datang</Text>
          <Text style={styles.title}>Masuk ke CAREKU</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color="#7C7C7C" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="kamu@email.com"
                placeholderTextColor="#A1A1AA"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={18} color="#7C7C7C" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                placeholderTextColor="#A1A1AA"
                secureTextEntry
                style={styles.input}
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button onPress={handleLogin} fullWidth disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <ActivityIndicator color="#FFF" /> : 'Masuk'}
          </Button>
        </View>

        <View style={styles.bottomInfo}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.altButton, googleLoading && styles.altButtonDisabled]}
            onPress={handleGoogle}>
            {googleLoading ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <>
                <Feather name="globe" size={18} color="#1A1A1A" />
                <Text style={styles.altButtonText}>Masuk dengan Google</Text>
              </>
            )}
          </TouchableOpacity>

          {hasBio && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.altButton, bioLoading && styles.altButtonDisabled]}
              onPress={handleBiometric}>
              {bioLoading ? (
                <ActivityIndicator size="small" color="#1A1A1A" />
              ) : (
                <>
                  {/* <Feather name="fingerprint" size={18} color="#1A1A1A" /> */}
                  <Fingerprint size={18} color="#1A1A1A" />
                  <Text style={styles.altButtonText}>Masuk dengan Biometrik</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* <Text style={styles.infoText}>
            Login ini terhubung ke Firebase Email/Password Auth.
          </Text> */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 6 }}>
            <Text style={[styles.infoTextSecondary, { textDecorationLine: 'underline' }]}>
              Belum punya akun? Daftar
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
  top: {
    marginTop: 28,
    marginBottom: 20,
    gap: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
  },
  bottomInfo: {
    marginTop: 18,
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 13,
    textAlign: 'center',
  },
  infoTextSecondary: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 12,
    textAlign: 'center',
  },
  altButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  altButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  altButtonDisabled: {
    opacity: 0.6,
  },
});

export default LoginScreen;
