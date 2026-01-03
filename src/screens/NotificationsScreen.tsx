import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { getStoredRefreshToken } from '../services/authStorage';
import { ReminderPayload } from '../controllers/remindersController';
import { addReminder, fetchReminders, toggleReminder, ReminderItem, removeReminder } from '../store/remindersSlice';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type SummaryItem = {
  id: string;
  icon: string;
  label: string;
  value: number;
};

const summaryItems: SummaryItem[] = [
  { id: 'active', icon: 'bell', label: 'Aktif', value: 3 },
  { id: 'today', icon: 'clock', label: 'Hari Ini', value: 5 },
  { id: 'week', icon: 'calendar', label: 'Minggu Ini', value: 12 },
];

const reminderTypes = [
  { id: 'obat', label: 'Medicine', icon: 'edit-3', accent: '#FF6FA5', badge: 'rgba(255, 111, 165, 0.15)' },
  { id: 'minum', label: 'Drink Water', icon: 'droplet', accent: '#3AC7E5', badge: 'rgba(58, 199, 229, 0.15)' },
  { id: 'janji_temu', label: 'Janji Temu', icon: 'calendar', accent: '#FF9C73', badge: 'rgba(255, 156, 115, 0.15)' },
  { id: 'pelengkap', label: 'Supplement', icon: 'heart', accent: '#B0B7C3', badge: 'rgba(176, 183, 195, 0.18)' },
];

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const { profile } = useAuth();
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(reminderTypes[0]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState('Daily');
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    getStoredRefreshToken().then(setRefreshToken);
  }, []);

  const dispatch = useAppDispatch();
  const reminders = useAppSelector(state => state.reminders.items);
  const reminderStatus = useAppSelector(state => state.reminders.status);

  const mapType = (typeValue: string) =>
    reminderTypes.find(t => t.id === typeValue || t.label === typeValue) || reminderTypes[0];

  const loadReminders = useCallback(() => {
    if (!profile?.id || !refreshToken) return;
    dispatch(fetchReminders({ uid: profile.id, refreshToken }));
  }, [dispatch, profile?.id, refreshToken]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useEffect(() => {
    setLoadingList(reminderStatus === 'loading');
  }, [reminderStatus]);

  const uiReminders = useMemo(
    () =>
      reminders.map(item => {
        const meta = mapType(item.type);
        return {
          ...item,
          icon: meta.icon,
          accent: meta.accent,
          badge: meta.badge,
          schedule: item.repeat,
        };
      }),
    [reminders],
  );

  const activeCount = useMemo(() => uiReminders.filter(item => item.enabled).length, [uiReminders]);
  const totalCount = uiReminders.length;

  const timeOptions = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      ['00', '30'].forEach(m => {
        const hh = h < 10 ? `0${h}` : `${h}`;
        slots.push(`${hh}:${m}`);
      });
    }
    return slots;
  }, []);

  const toggleReminderStatus = (id: string) => {
    if (!profile?.id || !refreshToken) {
      Alert.alert('Tidak bisa mengubah status', 'Pastikan sudah login.');
      return;
    }
    const current = reminders.find(r => r.id === id);
    if (!current) return;
    const nextEnabled = !current.enabled;
    dispatch(
      toggleReminder({
        uid: profile.id,
        refreshToken,
        reminderId: id,
        enabled: nextEnabled,
      }),
    ).catch(err => {
      Alert.alert('Error', err?.message || 'Gagal memperbarui status.');
    });
  };

  const resetForm = () => {
    setSelectedType(reminderTypes[0]);
    setTitle('');
    setTime('');
    setRepeat('Daily');
  };

  const handleDeleteReminder = (id: string) => {
    if (!profile?.id || !refreshToken) {
      Alert.alert('Tidak bisa menghapus', 'Pastikan sudah login.');
      return;
    }
    Alert.alert('Hapus Reminder', 'Yakin ingin menghapus reminder ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          dispatch(removeReminder({ uid: profile.id, refreshToken, reminderId: id })).catch(err =>
            Alert.alert('Error', err?.message || 'Gagal menghapus reminder.'),
          );
        },
      },
    ]);
  };

  const handleAddReminder = async () => {
    if (!profile?.id) {
      Alert.alert('Profil tidak ditemukan', 'Pastikan sudah login terlebih dahulu.');
      return;
    }
    if (!refreshToken) {
      Alert.alert('Token tidak ada', 'Tidak bisa menyimpan. Silakan login ulang.');
      return;
    }
    if (!title.trim() || !time.trim()) {
      Alert.alert('Lengkapi data', 'Judul dan waktu harus diisi.');
      return;
    }

    setSaving(true);
    const payload: ReminderPayload = {
      userId: profile.id,
      title: title.trim(),
      type: selectedType.label,
      time: time.trim(),
      repeat,
      enabled: true,
    };

    dispatch(addReminder({ refreshToken, payload }))
      .unwrap()
      .then(() => {
        resetForm();
        setModalVisible(false);
      })
      .catch((err: any) => {
        const message = err?.message || 'Gagal menambah reminder.';
        Alert.alert('Error', message);
      })
      .finally(() => setSaving(false));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0e0e0f', '#0073FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Pengingat</Text>
              <Text style={styles.headerSubtitle}>Jangan pernah melewatkan tugas penting</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            {summaryItems.map(item => {
              const value =
                item.id === 'active'
                  ? activeCount
                  : item.id === 'today'
                    ? totalCount
                    : totalCount;
              return (
                <View key={item.id} style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Feather name={item.icon as any} size={20} color="#FF6FA5" />
                  </View>
                  <Text style={styles.summaryValue}>{value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Semua Pengingat</Text>

          {loadingList ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator />
            </View>
          ) : uiReminders.length === 0 ? (
            <Text style={{ color: '#6B7280' }}>Belum ada reminder.</Text>
          ) : (
            uiReminders.map(item => (
              <View key={item.id} style={styles.reminderCard}>
                <View style={[styles.iconBadge, { backgroundColor: item.badge }]}>
                  <Feather name={item.icon as any} size={22} color={item.accent} />
                </View>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={14} color="#7A7F87" />
                      <Text style={styles.metaText}>{item.time}</Text>
                    </View>
                    <View style={[styles.metaItem, { marginLeft: 12 }]}>
                      <Feather name="repeat" size={14} color="#7A7F87" />
                      <Text style={styles.metaText}>{item.schedule}</Text>
                    </View>
                  </View>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleReminderStatus(item.id)}
                  trackColor={{ false: '#E5E7EB', true: '#6EC9FF' }}
                  thumbColor={item.enabled ? '#FFFFFF' : '#FFFFFF'}
                />
                <TouchableOpacity
                  style={styles.moreButton}
                  activeOpacity={0.6}
                  onPress={() => handleDeleteReminder(item.id)}>
                  <Feather name="trash-2" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#0e0e0f', '#0073FF']} style={styles.fabGradient}>
          <Feather name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tambah Pengingat Baru</Text>

            <Text style={styles.label}>Tipe</Text>
            <View style={styles.selectorRow}>
              {reminderTypes.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.selectorChip,
                    selectedType.id === option.id && styles.selectorChipActive,
                  ]}
                  onPress={() => setSelectedType(option)}>
                  <Feather name={option.icon as any} size={16} color={option.accent} />
                  <Text style={styles.selectorText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Judul</Text>
            <TextInput
              placeholder="Masukkan judul pengingat"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.rowSpace}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Waktu</Text>
                <TouchableOpacity
                  style={[styles.input, styles.inputButton]}
                  onPress={() => setTimePickerVisible(true)}>
                  <Text style={time ? styles.inputValue : styles.placeholderText}>
                    {time || '--:--'}
                  </Text>
                  <Feather name="clock" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Ulangi</Text>
                <View style={styles.selectorRow}>
                  {['Daily', 'Weekly', 'Monthly'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.selectorChip,
                        repeat === option && styles.selectorChipActive,
                      ]}
                      onPress={() => setRepeat(option)}>
                      <Text style={styles.selectorText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { resetForm(); setModalVisible(false); }}>
                <Text style={styles.secondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleAddReminder}
                disabled={saving}>
                <LinearGradient colors={['#0e0e0f', '#0073FF']} style={styles.primaryGradient}>
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryText}>Tambah Pengingat</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={timePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerVisible(false)}>
        <View style={styles.timeOverlay}>
          <View style={styles.timeSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pick Time</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {timeOptions.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={styles.timeRow}
                  onPress={() => {
                    setTime(slot);
                    setTimePickerVisible(false);
                  }}>
                  <Text style={styles.timeText}>{slot}</Text>
                  {time === slot && <Feather name="check" size={18} color="#0F8FF9" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginTop: 10 }]}
              onPress={() => setTimePickerVisible(false)}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#7A7F87',
    fontSize: 12,
  },
  moreButton: {
    marginLeft: 10,
    padding: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 26,
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#111827',
    marginBottom: 8,
    fontWeight: '600',
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  selectorChipActive: {
    borderColor: '#0F8FF9',
    borderWidth: 1,
    backgroundColor: '#E0F2FF',
  },
  selectorText: {
    color: '#111827',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputValue: {
    color: '#111827',
    fontSize: 14,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  rowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
  },
  primaryGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  timeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  timeSheet: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  timeRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeText: {
    fontSize: 15,
    color: '#111827',
  },
});

export default NotificationsScreen;
