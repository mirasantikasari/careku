import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Button } from '../ui/Button';
import { signUpWithEmail, signInWithGoogleIdToken } from '../services/firebaseAuth';
import { storeToken, storeRefreshToken, getStoredRefreshToken } from '../services/authStorage';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogleToken } from '../services/googleSignIn';
import { saveUserProfileWithRefreshToken } from '../services/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type RegisterStep = 'account' | 'health' | 'conditions';
type RegisterMethod = 'email' | 'google';

const conditionOptions = [
  { key: 'Endometriosis', icon: 'life-buoy' },
  { key: 'Menstrual Disorder', icon: 'droplet' },
  { key: 'Gastric Issues', icon: 'activity' },
  { key: 'PCOS', icon: 'heart' },
  { key: 'Thyroid Issues', icon: 'feather' },
];

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<RegisterStep>('account');
  const [method, setMethod] = useState<RegisterMethod>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const { setProfile } = useAuth();

  const progress = useMemo(() => {
    if (step === 'account') return 0;
    if (step === 'health') return 0.5;
    return 1;
  }, [step]);

  const handleCreateAccount = async () => {
    if (loading) return;
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (password !== confirm) {
      setError('Konfirmasi password tidak sesuai.');
      return;
    }

    try {
      setLoading(true);
      const res = await signUpWithEmail(email.trim(), password);
      setUid(res.localId);
      setRefreshToken(res.refreshToken);
      setMethod('email');
      await storeToken(res.idToken);
      await storeRefreshToken(res.refreshToken);
      setStep('health');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    setError(null);
    try {
      setLoading(true);
      const { idToken: googleIdToken, profile } = await signInWithGoogleToken();
      const res = await signInWithGoogleIdToken(googleIdToken);
      setUid(res.localId);
      setRefreshToken(res.refreshToken);
      setMethod('google');
      await storeToken(res.idToken);
      await storeRefreshToken(res.refreshToken);
      if (!name) {
        setName(profile.name || '');
      }
      if (!email) {
        setEmail(profile.email || '');
      }
      await setProfile({
        id: res.localId,
        name: profile.name,
        email: profile.email,
        photo: profile.photo,
      });
      setStep('health');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal login Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    let effectiveRefresh = refreshToken;
    if (!uid || !effectiveRefresh) {
      const stored = await getStoredRefreshToken();
      if (stored) {
        effectiveRefresh = stored;
        setRefreshToken(stored);
      } else {
        setError('Sesi belum siap. Coba daftar ulang.');
        return;
      }
    }
    if (!age || !height || !weight) {
      setError('Isi umur, tinggi, dan berat badan.');
      return;
    }

    const conditions = [
      ...selectedConditions,
      ...(otherCondition.trim() ? [otherCondition.trim()] : []),
    ];

    try {
      setLoading(true);
      await saveUserProfileWithRefreshToken(
        {
          uid,
          name: name.trim(),
          email: email.trim(),
          provider: method,
          age: Number(age),
          heightCm: Number(height),
          weightKg: Number(weight),
          conditions,
        },
        effectiveRefresh,
      );
      await setProfile({
        id: uid,
        name: name.trim(),
        email: email.trim(),
        age: Number(age),
        heightCm: Number(height),
        weightKg: Number(weight),
        conditions,
      });
      navigation.replace('Main');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (label: string) => {
    setSelectedConditions(prev =>
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label],
    );
  };

  const renderProgress = () => (
    <View style={styles.progressWrapper}>
      <View style={[styles.progressBar, progress >= 0.33 && styles.progressActive]} />
      <View style={[styles.progressBar, progress >= 0.66 && styles.progressActive]} />
      <View style={[styles.progressBar, progress >= 1 && styles.progressActive]} />
    </View>
  );

  const renderAccountStep = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Buat Akun</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Nama Lengkap</Text>
        <View style={styles.inputWrapper}>
          <Feather name="user" size={18} color="#7C7C7C" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nama kamu"
            placeholderTextColor="#A1A1AA"
            style={styles.input}
          />
        </View>
      </View>

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

      <View style={styles.field}>
        <Text style={styles.label}>Konfirmasi Password</Text>
        <View style={styles.inputWrapper}>
          <Feather name="check-circle" size={18} color="#7C7C7C" />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="********"
            placeholderTextColor="#A1A1AA"
            secureTextEntry
            style={styles.input}
          />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button onPress={handleCreateAccount} fullWidth disabled={loading} style={{ marginTop: 4 }}>
        {loading && method === 'email' ? <ActivityIndicator color="#FFF" /> : 'Buat Akun'}
      </Button>

      <View style={styles.orWrapper}>
        <View style={styles.divider} />
        <Text style={styles.orText}>atau</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.altButton, loading && styles.altButtonDisabled]}
        onPress={handleGoogle}>
        {loading && method === 'google' ? (
          <ActivityIndicator size="small" color="#1A1A1A" />
        ) : (
          <>
            <Feather name="globe" size={18} color="#1A1A1A" />
            <Text style={styles.altButtonText}>Lanjut dengan Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderHealthStep = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Health Profile Setup</Text>
      <Text style={styles.stepSubtitle}>Mari kenalan lebih dekat</Text>
      {renderProgress()}

      <View style={styles.field}>
        <Text style={styles.label}>Usia</Text>
        <View style={styles.inputWrapper}>
          <Feather name="calendar" size={18} color="#7C7C7C" />
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Masukkan usia"
            placeholderTextColor="#A1A1AA"
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
      </View>

      <View style={[styles.row, { gap: 12 }]}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Tinggi (cm)</Text>
          <View style={styles.inputWrapper}>
            <Feather name="arrow-up-right" size={18} color="#7C7C7C" />
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="160"
              placeholderTextColor="#A1A1AA"
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Berat (kg)</Text>
          <View style={styles.inputWrapper}>
            <Feather name="activity" size={18} color="#7C7C7C" />
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="50"
              placeholderTextColor="#A1A1AA"
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Informasi ini membantu Careku memberi rekomendasi yang dipersonalisasi.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button onPress={() => setStep('conditions')} fullWidth style={{ marginTop: 8 }}>
        Lanjut
      </Button>
    </View>
  );

  const renderConditionsStep = () => (
    <View style={styles.card}>
      <Text style={styles.stepTitle}>Health Profile Setup</Text>
      <Text style={styles.stepSubtitle}>Pilih kondisi kesehatanmu</Text>
      {renderProgress()}

      <View style={{ gap: 10, marginTop: 10 }}>
        {conditionOptions.map(item => {
          const active = selectedConditions.includes(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.conditionCard, active && styles.conditionActive]}
              onPress={() => toggleCondition(item.key)}>
              <View style={styles.row}>
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={active ? '#0F172A' : '#6B7280'}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.conditionText}>{item.key}</Text>
              </View>
              {active ? <Feather name="check" size={18} color="#0F172A" /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.field, { marginTop: 12 }]}>
        <Text style={styles.label}>Lainnya</Text>
        <View style={styles.inputWrapper}>
          <Feather name="edit-3" size={18} color="#7C7C7C" />
          <TextInput
            value={otherCondition}
            onChangeText={setOtherCondition}
            placeholder="Tulis kondisi lain (opsional)"
            placeholderTextColor="#A1A1AA"
            style={styles.input}
          />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button onPress={handleSaveProfile} fullWidth disabled={loading} style={{ marginTop: 10 }}>
        {loading ? <ActivityIndicator color="#FFF" /> : 'Selesai'}
      </Button>
    </View>
  );

  const renderStep = () => {
    if (step === 'account') return renderAccountStep();
    if (step === 'health') return renderHealthStep();
    return renderConditionsStep();
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.top}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.subtitle}>Ayo bergabung</Text>
            <Text style={styles.title}>Daftar ke CAREKU</Text>
          </View>

          {renderStep()}

          <View style={styles.bottomInfo}>
            <Text style={styles.infoText}>
              Dengan mendaftar kamu menyetujui ketentuan CAREKU.
            </Text>
            {step === 'account' ? (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.altButton}
                onPress={() => navigation.replace('Login')}>
                <Feather name="log-in" size={18} color="#1A1A1A" />
                <Text style={styles.altButtonText}>Sudah punya akun? Masuk</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
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
    marginBottom: 12,
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
    marginBottom: 20,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 13,
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
  orWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    color: '#6B7280',
    fontSize: 12,
  },
  progressWrapper: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  progressActive: {
    backgroundColor: '#0073FF',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: 'rgba(0,115,255,0.08)',
    borderRadius: 12,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionActive: {
    borderColor: '#0073FF',
    backgroundColor: 'rgba(0,115,255,0.08)',
  },
  conditionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
