import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { Button } from '../ui/Button';
import { getStoredRefreshToken } from '../services/authStorage';
import { updateUserFields } from '../services/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, setProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [height, setHeight] = useState(profile?.heightCm ? String(profile.heightCm) : '');
  const [weight, setWeight] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!profile?.id) return;
    setError(null);
    try {
      setLoading(true);
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        setError('Sesi kadaluarsa. Silakan login ulang.');
        return;
      }
      const updates: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        age: age ? Number(age) : undefined,
        heightCm: height ? Number(height) : undefined,
        weightKg: weight ? Number(weight) : undefined,
      };
      await updateUserFields(profile.id, refreshToken, updates);
      await setProfile({
        ...profile,
        ...updates,
      });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <LinearGradient
        colors={['#0e0e0f', '#0073FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profil</Text>
        </View>
      </LinearGradient>

      <View style={styles.form}>
        <Field label="Nama" icon="user">
          <TextInput value={name} onChangeText={setName} placeholder="Nama lengkap" style={styles.input} />
        </Field>
        <Field label="Email" icon="mail">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@kamu.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </Field>
        <Field label="Nomor Telepon" icon="phone">
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="08xxxx"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Field>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Field label="Usia" icon="calendar" style={{ flex: 1 }}>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder="24"
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>
          <Field label="Tinggi (cm)" icon="arrow-up-right" style={{ flex: 1 }}>
            <TextInput
              value={height}
              onChangeText={setHeight}
              placeholder="160"
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>
        </View>
        <Field label="Berat (kg)" icon="activity">
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="50"
            keyboardType="number-pad"
            style={styles.input}
          />
        </Field>

        {error ? <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text> : null}

        <Button onPress={handleSave} fullWidth disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <ActivityIndicator color="#FFF" /> : 'Simpan'}
        </Button>
      </View>
    </ScrollView>
  );
};

const Field = ({
  label,
  icon,
  children,
  style,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
  style?: any;
}) => (
  <View style={[{ marginBottom: 14 }, style]}>
    <Text style={{ marginBottom: 6, color: '#0F172A', fontWeight: '600' }}>{label}</Text>
    <View style={styles.field}>
      <Feather name={icon as any} size={18} color="#7C7C7C" style={{ marginRight: 8 }} />
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default ProfileEditScreen;
