import React, { useState, useMemo } from 'react';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import ScreenHeader from '../ui/ScreenHeader';
import Feather from 'react-native-vector-icons/Feather';
import Card from '../ui/Card';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import { UtensilsCrossed, Activity as ActivityIcon } from 'lucide-react-native';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Food'>,
  NativeStackScreenProps<RootStackParamList>
>;

type DataItem = {
  id: string;
  name: string;
  status: 'safe' | 'limit' | 'avoid';
  desc: string;
};

const statusConfig: Record<DataItem['status'], { bg: string, color: string; icon: string; label: string }> = {
  safe: { bg: '#E8F5E9', color: '#10B981', icon: 'check-circle', label: 'Aman' },
  limit: { bg: '#FFF3E0', color: '#F59E0B', icon: 'alert-triangle', label: 'Batasi' },
  avoid: { bg: '#FFEBEE', color: '#EF4444', icon: 'x-circle', label: 'Hindari' },
};

const foods: DataItem[] = [
  { id: '1', name: 'Salmon & Ikan Berlemak', status: 'safe', desc: 'Kaya omega-3, anti-inflamasi' },
  { id: '2', name: 'Sayuran Hijau', status: 'safe', desc: 'Tinggi serat dan nutrisi' },
  { id: '3', name: 'Buah Berry', status: 'safe', desc: 'Antioksidan tinggi' },
  { id: '4', name: 'Makanan Pedas', status: 'avoid', desc: 'Dapat memicu inflamasi' },
  { id: '5', name: 'Kafein Berlebih', status: 'limit', desc: 'Batasi 1-2 cangkir/hari' },
  { id: '6', name: 'Gorengan', status: 'avoid', desc: 'Tinggi lemak jenuh' },
  { id: '7', name: 'Alpukat', status: 'safe', desc: 'Lemak sehat dan vitamin E' },
  { id: '8', name: 'Alkohol', status: 'avoid', desc: 'Hindari sepenuhnya' },
];

const activities: DataItem[] = [
  { id: '1', name: 'Yoga', status: 'safe', desc: 'Relaksasi dan fleksibilitas' },
  { id: '2', name: 'Jalan Santai 30 menit', status: 'safe', desc: 'Kardio ringan, aman' },
  { id: '3', name: 'Swimming', status: 'safe', desc: 'Low impact, bagus untuk sendi' },
  { id: '4', name: 'HIIT Intense', status: 'limit', desc: 'Batasi intensitas' },
  { id: '5', name: 'Angkat Beban Berat', status: 'limit', desc: 'Konsultasi dokter dulu' },
  { id: '6', name: 'Pilates', status: 'safe', desc: 'Core strength tanpa tekanan' }
];

const FoodScreen: React.FC<Props> = ({ navigation }) => {
  const [active, setActive] = useState<'food' | 'activity'>('food');

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Card variant="white">
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.segmentItem, active === 'food' && styles.segmentItemActive]}
              onPress={() => setActive('food')}>
              <View style={styles.segmentContent}>
                <UtensilsCrossed
                  size={18}
                  color={active === 'food' ? '#111827' : '#8A8A8A'}
                  strokeWidth={2}
                />
                <Text style={[styles.segmentLabel, active === 'food' && styles.segmentLabelActive]}>
                  Makanan
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.segmentItem, active === 'activity' && styles.segmentItemActive]}
              onPress={() => setActive('activity')}>
              <View style={styles.segmentContent}>
                <ActivityIcon
                  size={18}
                  color={active === 'activity' ? '#111827' : '#8A8A8A'}
                  strokeWidth={2}
                />
                <Text style={[styles.segmentLabel, active === 'activity' && styles.segmentLabelActive]}>
                  Aktivitas
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    ),
    [active],
  );

  const renderFood = ({ item }: { item: DataItem }) => {
    const cfg = statusConfig[item.status];
    return (
      <Card
        variant="white"
        style={styles.foodCard}>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon as any} size={20} color={cfg.color} />
        </View>
        <View style={styles.foodTextBlock}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodDesc}>{item.desc}</Text>
        </View>
        <Text style={[styles.foodStatus, { color: cfg.color }]}>{cfg.label}</Text>
      </Card>
    );
  };

  const data = active === 'food' ? foods : activities;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Panduan Kesehatan"
        subtitle=""
        onBack={() => navigation.goBack()}
      />

      {listHeader}

      <FlatList
        data={data}
        renderItem={renderFood}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>Konten akan hadir di sini.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default FoodScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 6,
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentLabel: {
    fontSize: 14,
    color: '#8A8A8A',
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodTextBlock: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  foodDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  foodStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBlock: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
  },
});
