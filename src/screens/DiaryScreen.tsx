// src/screens/DiaryScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Slider from '@react-native-community/slider';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Card from '../ui/Card';
import { Button } from '../ui/Button';
import ScreenHeader from '../ui/ScreenHeader';

type MoodId = 'happy' | 'neutral' | 'sad';
type AnalysisResult = 'safe' | 'warning' | null;

type Props = NativeStackScreenProps<RootStackParamList, 'Diary'>;

type MoodOption = {
  id: MoodId;
  icon: string;
  label: string;
  color: string;
};

const DiaryScreen: React.FC<Props> = ({ navigation }) => {
  const [food, setFood] = useState('');
  const [activity, setActivity] = useState('');
  const [painLevel, setPainLevel] = useState(5);
  const [mood, setMood] = useState<MoodId>('neutral');
  const [showResult, setShowResult] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult>(null);

  const moods: MoodOption[] = [
    { id: 'happy', icon: 'smile', label: 'Senang', color: '#4DA6FF' },
    { id: 'neutral', icon: 'meh', label: 'Biasa saja', color: '#7C7C7C' },
    { id: 'sad', icon: 'frown', label: 'Sedih', color: '#FFC1E3' },
  ];

  const handleSubmit = () => {
    const lower = food.toLowerCase();
    const hasSpicyFood = lower.includes('pedas') || lower.includes('sambal');
    setAnalysis(hasSpicyFood ? 'warning' : 'safe');
    setShowResult(true);
  };

  const renderForm = () => (
    <View style={styles.formWrapper}>
      <Card variant="white" style={styles.card}>
        <Text style={styles.label}>Makanan Hari Ini</Text>
        <View style={styles.textAreaWrapper}>
          <TextInput
            value={food}
            onChangeText={setFood}
            placeholder="Contoh: Nasi goreng, ayam bakar, jus alpukat..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.textArea}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.micButton}
            onPress={() => {}}>
            <Feather name="mic" size={20} color="#7C7C7C" />
          </TouchableOpacity>
        </View>
      </Card>

      <Card variant="white" style={styles.card}>
        <Text style={styles.label}>Aktivitas Hari Ini</Text>
        <TextInput
          value={activity}
          onChangeText={setActivity}
          placeholder="Contoh: Jalan pagi 20 menit, yoga..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={styles.textArea}
        />
      </Card>

      <Card variant="white" style={styles.card}>
        <Text style={styles.label}>Level Nyeri</Text>
        <View style={styles.sliderSection}>
          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={painLevel}
            onValueChange={value => setPainLevel(value)}
            minimumTrackTintColor="#4DA6FF"
            maximumTrackTintColor="#F5F5F5"
            thumbTintColor="#FFC1E3"
          />
          <View style={styles.sliderLabelsRow}>
            <Text style={styles.sliderLabelMuted}>Tidak Nyeri</Text>
            <Text style={styles.sliderLabelValue}>{painLevel}/10</Text>
            <Text style={styles.sliderLabelMuted}>Sangat Nyeri</Text>
          </View>
        </View>
      </Card>

      <Card variant="white" style={styles.card}>
        <Text style={styles.label}>Mood Hari Ini</Text>
        <View style={styles.moodRow}>
          {moods.map(m => {
            const isActive = mood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => setMood(m.id)}
                style={[styles.moodButton, isActive && styles.moodButtonActive]}>
                <Feather name={m.icon as any} size={32} color={m.color} />
                <Text style={styles.moodLabel}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Button onPress={handleSubmit} variant="gradient" fullWidth size="lg">
        <Feather name="send" size={18} color="#FFFFFF" />
        <Text style={styles.buttonText}>Analisis AI</Text>
      </Button>
    </View>
  );

  const renderResult = () => {
    const isWarning = analysis === 'warning';

    return (
      <View style={styles.resultWrapper}>
        <Card variant={isWarning ? 'white' : 'gradient'} style={styles.resultCard}>
          {isWarning ? (
            <>
              <View style={styles.resultIconWarningWrapper}>
                <Feather name="alert-triangle" size={40} color="#EF4444" />
              </View>
              <Text style={styles.resultTitle}>Perhatikan pilihan makanan</Text>
              <Text style={styles.resultText}>
                Makanan pedas bisa memperburuk kondisi. Coba pilih yang lebih lembut dulu, ya.
              </Text>
              <View style={styles.resultBoxWarning}>
                <Text style={styles.resultBoxText}>
                  <Text style={{ fontWeight: '700' }}>Rekomendasi: </Text>
                  Sup ayam atau smoothie buah bisa jadi alternatif aman.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.resultIconSafeWrapper}>
                <Feather name="check-circle" size={40} color="#22C55E" />
              </View>
              <Text style={styles.resultTitle}>Pilihanmu oke!</Text>
              <Text style={styles.resultText}>
                Menu hari ini sudah sehat. Pertahankan kebiasaan baik ini.
              </Text>
              <View style={styles.resultBoxSafe}>
                <Text style={styles.resultBoxText}>
                  <Text style={{ fontWeight: '700' }}>Insight: </Text>
                  Jaga konsistensi, kamu makin dekat dengan target kesehatan.
                </Text>
              </View>
            </>
          )}

          <View style={styles.resultButtonsRow}>
            <Button onPress={() => setShowResult(false)} variant="outline" fullWidth>
              <Text style={styles.buttonTextDark}>Edit</Text>
            </Button>
            <Button onPress={() => navigation.goBack()} variant="gradient" fullWidth>
              <Text style={styles.buttonText}>Selesai</Text>
            </Button>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Cerita Hari Ini"
        subtitle="Bagikan hari kamu, biar AI bisa bantu"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>{!showResult ? renderForm() : renderResult()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  formWrapper: {
    gap: 12,
  } as any,
  card: {
    marginBottom: 8,
  },
  label: {
    color: '#1A1A1A',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaWrapper: {
    position: 'relative',
  },
  textArea: {
    borderWidth: 2,
    borderColor: 'rgba(255,193,227,0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  micButton: {
    position: 'absolute',
    right: 12,
    bottom: 10,
  },
  sliderSection: {
    gap: 8,
  } as any,
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelMuted: {
    fontSize: 12,
    color: '#7C7C7C',
  },
  sliderLabelValue: {
    fontSize: 13,
    color: '#FFC1E3',
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  moodButtonActive: {
    borderColor: '#FFC1E3',
    backgroundColor: 'rgba(255,193,227,0.1)',
  },
  moodLabel: {
    fontSize: 11,
    color: '#1A1A1A',
    marginTop: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonTextDark: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  resultWrapper: {
    paddingTop: 8,
  },
  resultCard: {
    alignItems: 'center',
  },
  resultIconWarningWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultIconSafeWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    color: '#7C7C7C',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultBoxWarning: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FFB74D',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  resultBoxSafe: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#66BB6A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  resultBoxText: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  resultButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  } as any,
});

export default DiaryScreen;
