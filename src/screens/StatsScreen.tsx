import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import Svg, { Polyline, Circle, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import { getStoredRefreshToken } from '../services/authStorage';
import { getMetricsRange, DailyMetric } from '../services/homeData';
import { useAuth } from '../context/AuthContext';
import { styles as themeStyles } from '../theme/general';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Stats'>,
  NativeStackScreenProps<RootStackParamList>
>;

type RangeKey = 'week' | 'month';

const { width: screenWidth } = Dimensions.get('window');

const StatsScreen: React.FC<Props> = () => {
  const { profile } = useAuth();
  const [range, setRange] = useState<RangeKey>('week');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!profile?.id) return;
    setError(null);
    setLoading(true);
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        setError('Sesi kadaluarsa. Silakan login ulang.');
        return;
      }
      const { start, end } = getRange(range);
      const data = await getMetricsRange(profile.id, refreshToken, start, end);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range, profile?.id]);

  const painSeries = useMemo(() => metrics.map(m => m.painLevel ?? 0), [metrics]);
  const waterSeries = useMemo(() => metrics.map(m => m.waterIntake ?? 0), [metrics]);
  const dateLabels = useMemo(() => metrics.map(m => m.date.slice(5)), [metrics]); // MM-DD
  const insights = useMemo(() => buildInsights(metrics), [metrics]);

  const healthScore = useMemo(() => {
    if (!metrics.length) return 0;
    // Simple heuristic: higher water, lower pain => better score.
    const painAvg = avg(painSeries);
    const waterAvg = avg(waterSeries);
    const score = Math.max(
      0,
      Math.min(100, 80 + (waterAvg - 4) * 3 - (painAvg - 3) * 4),
    );
    return Math.round(score);
  }, [metrics, painSeries, waterSeries]);

  return (
    <ScrollView style={themeStyles.root} contentContainerStyle={{ paddingBottom: 24 }}>
      <LinearGradient
        colors={['#0e0e0f', '#0073FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16, marginBottom: 14 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 12 }}>
          Stats & Insights
        </Text>

        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <HealthCircle score={healthScore} />
          <Text style={{ color: '#fff', marginTop: 8 }}>
            {healthScore >= 70 ? 'Baik! Pertahankan' : 'Tetap semangat, perbaiki kebiasaan 💪'}
          </Text>
        </View>

        <View style={styles.switcher}>
          <TouchableOpacity
            onPress={() => setRange('week')}
            style={[styles.switchButton, range === 'week' && styles.switchActive]}>
            <Text style={{ color: range === 'week' ? '#0F172A' : '#6B7280', fontWeight: '600' }}>
              Minggu Ini
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRange('month')}
            style={[styles.switchButton, range === 'month' && styles.switchActive]}>
            <Text style={{ color: range === 'month' ? '#0F172A' : '#6B7280', fontWeight: '600' }}>
              Bulan Ini
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <>
          <StatCard title="Level Nyeri">
            <LineChart
              data={painSeries}
              labels={dateLabels}
              color="#f472b6"
              height={180}
              maxValue={10}
            />
          </StatCard>

          <StatCard title="Mood & Aktivitas">
            <LineChart
              data={waterSeries}
              labels={dateLabels}
              color="#3b82f6"
              height={180}
              maxValue={Math.max(8, Math.max(...waterSeries, 0) + 1)}
            />
          </StatCard>

          <View style={{ marginHorizontal: 10, marginTop: 4 }}>
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>
              AI Insights ✨
            </Text>
            {insights.length === 0 ? (
              <Text style={{ color: '#6B7280' }}>Belum ada cukup data minggu ini.</Text>
            ) : (
              insights.map((insight, idx) => (
                <InsightCard key={idx} tone={insight.tone} title={insight.title} desc={insight.desc} />
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const StatCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View
    style={{
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 10,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    }}>
    <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>{title}</Text>
    {children}
  </View>
);

const HealthCircle = ({ score }: { score: number }) => {
  const radius = 40;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = (score / 100) * circumference;

  return (
    <Svg width={120} height={120}>
      <Defs>
        <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#4da6ff" />
          <Stop offset="100%" stopColor="#f472b6" />
        </SvgGradient>
      </Defs>
      <Circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx="60"
        cy="60"
      />
      <Circle
        stroke="url(#grad)"
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={`${progress}, ${circumference}`}
        strokeLinecap="round"
        r={normalizedRadius}
        cx="60"
        cy="60"
      />
      <SvgText
        x="60"
        y="65"
        fontSize="22"
        fontWeight="700"
        fill="#ffffffff"
        textAnchor="middle">
        {score}
      </SvgText>
    </Svg>
  );
};

const LineChart = ({
  data,
  labels,
  color,
  height = 160,
  maxValue,
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  maxValue: number;
}) => {
  const padding = 24;
  const width = screenWidth - 40;
  const points = useMemo(() => {
    if (!data.length) return '';
    const stepX = data.length === 1 ? width / 2 : (width - padding * 2) / (data.length - 1);
    const maxY = Math.max(maxValue, ...data, 1);
    return data
      .map((val, idx) => {
        const x = padding + idx * stepX;
        const y = padding + (1 - val / maxY) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, height, maxValue]);

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
        {points.split(' ').map((pt, idx) => {
          if (!pt) return null;
          const [x, y] = pt.split(',').map(Number);
          return <Circle key={idx} cx={x} cy={y} r={4} fill="#fff" stroke={color} strokeWidth={2} />;
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map((label, idx) => (
          <Text key={idx} style={{ color: '#6B7280', fontSize: 10 }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  switchActive: {
    backgroundColor: '#f1f5f9',
  },
});

const getRange = (range: RangeKey) => {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const startDate = new Date(now);
  if (range === 'week') {
    startDate.setDate(now.getDate() - 6);
  } else {
    startDate.setDate(now.getDate() - 29);
  }
  const start = startDate.toISOString().slice(0, 10);
  return { start, end };
};

const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

type Insight = { tone: 'warn' | 'good'; title: string; desc: string };
const buildInsights = (metrics: DailyMetric[]): Insight[] => {
  if (!metrics.length) return [];
  const painAvg = avg(metrics.map(m => m.painLevel ?? 0));
  const waterAvg = avg(metrics.map(m => m.waterIntake ?? 0));
  const activeDays = metrics.filter(m => (m.waterIntake ?? 0) >= 6).length;

  const result: Insight[] = [];

  if (waterAvg < 6) {
    result.push({
      tone: 'warn',
      title: 'Konsumsi Air Rendah ⚠️',
      desc: `Rata-rata minum ${waterAvg.toFixed(1)} gelas. Coba capai 8 gelas per hari.`,
    });
  } else {
    result.push({
      tone: 'good',
      title: 'Hidrasi Konsisten 💧',
      desc: `Rata-rata minum ${waterAvg.toFixed(1)} gelas. Pertahankan ya!`,
    });
  }

  if (painAvg >= 5) {
    result.push({
      tone: 'warn',
      title: 'Level Nyeri Meningkat',
      desc: `Rata-rata nyeri ${painAvg.toFixed(1)}. Catat pemicu dan pertimbangkan konsultasi.`,
    });
  } else {
    result.push({
      tone: 'good',
      title: 'Nyeri Terkendali 😊',
      desc: `Rata-rata nyeri ${painAvg.toFixed(1)}. Bagus, jaga pola yang membantu.`,
    });
  }

  if (activeDays >= Math.ceil(metrics.length * 0.6)) {
    result.push({
      tone: 'good',
      title: 'Rutinitas Baik 🏆',
      desc: `${activeDays} dari ${metrics.length} hari hidrasi baik (>=6 gelas).`,
    });
  }

  return result;
};

const InsightCard = ({ tone, title, desc }: { tone: 'warn' | 'good'; title: string; desc: string }) => {
  const bg = tone === 'warn' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.15)';
  const iconBg = tone === 'warn' ? '#f87171' : '#4ade80';
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}>
        <Text style={{ color: iconBg }}>{tone === 'warn' ? '📈' : '✨'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>{title}</Text>
        <Text style={{ color: '#4b5563', marginTop: 4 }}>{desc}</Text>
      </View>
    </View>
  );
};

export default StatsScreen;
