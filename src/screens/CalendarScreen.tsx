import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { getStoredRefreshToken } from '../services/authStorage';
import { CalendarEvent, EventType } from '../services/calendarData';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { addCalendarEvent, deleteCalendarEvent, fetchMonthEvents } from '../store/calendarSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const eventTypes: { key: EventType; label: string; color: string }[] = [
  { key: 'appointment', label: 'Appointments', color: '#3B82F6' },
  { key: 'medication', label: 'Medication', color: '#F9A8D4' },
  { key: 'period', label: 'Period', color: '#EF4444' },
  { key: 'checkup', label: 'Check-ups', color: '#22C55E' },
];

const CalendarScreen: React.FC<Props> = ({ navigation }) => {
  const { profile } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(toKey(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formType, setFormType] = useState<EventType>('appointment');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthKey = `${month.getFullYear()}-${pad(month.getMonth() + 1)}`;
  const events = useSelector<RootState, CalendarEvent[]>(
    state => state.calendar.eventsByMonth[monthKey] || [],
  );
  const loading = useSelector<RootState, boolean>(
    state => state.calendar.status === 'loading',
  );

  const days = useMemo(() => buildMonthDays(month), [month]);
  const monthLabel = useMemo(
    () => month.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [month],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(evt => {
      const arr = map.get(evt.date) || [];
      arr.push(evt);
      map.set(evt.date, arr);
    });
    return map;
  }, [events]);

  const selectedEvents = eventsByDate.get(selectedDateKey) || [];

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      setError(null);
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        setError('Sesi kadaluarsa. Silakan login ulang.');
        return;
      }
      const start = toKey(new Date(month.getFullYear(), month.getMonth(), 1));
      const end = toKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
      dispatch(fetchMonthEvents({ uid: profile.id, refreshToken, start, end, monthKey }));
    };
    load();
  }, [month, profile?.id, dispatch, monthKey]);

  const changeMonth = (delta: number) => {
    const next = new Date(month);
    next.setMonth(month.getMonth() + delta);
    setMonth(next);
    setSelectedDateKey(toKey(new Date(next.getFullYear(), next.getMonth(), 1)));
  };

  const handleAddEvent = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        setError('Sesi kadaluarsa. Silakan login ulang.');
        return;
      }
      await dispatch(
        addCalendarEvent({
          uid: profile.id,
          refreshToken,
          monthKey,
          data: {
            date: selectedDateKey,
            title: formTitle.trim(),
            time: formTime.trim(),
            type: formType,
          },
        }),
      );
      setModalVisible(false);
      setFormTitle('');
      setFormTime('');
      setFormType('appointment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.id) return;
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        setError('Sesi kadaluarsa. Silakan login ulang.');
        return;
      }
      await dispatch(deleteCalendarEvent({ uid: profile.id, refreshToken, eventId: id, monthKey }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus event');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <LinearGradient colors={['#0e0e0f', '#0073FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Health Calendar</Text>
            <Text style={styles.headerSubtitle}>Track appointments & cycles</Text>
          </View>
        </View>

        <LinearGradient
          colors={['#d5d5ffff', '#9fa1a3ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.monthSwitcher}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
            <Feather name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.calendarCard}>
          <View style={styles.weekRow}>
            {weekdayLabels.map(label => (
              <Text key={label} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {days.map(day => {
              const key = toKey(day.date);
              const isSelected = key === selectedDateKey;
              const hasEvent = eventsByDate.has(key);
              const dayEvents = eventsByDate.get(key) || [];
              const dotColor = dayEvents.length ? getColor(dayEvents[0].type) : '#F472B6';
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.dayCell, isSelected && styles.daySelected]}
                  onPress={() => setSelectedDateKey(key)}
                  activeOpacity={0.8}>
                  <View style={[styles.dayInner, isSelected && styles.dayInnerSelected]}>
                    <Text style={[styles.dayText, !day.inMonth && { color: '#CBD5E1' }, isSelected && { color: '#0F172A' }]}>
                      {day.date.getDate()}
                    </Text>
                    {hasEvent ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Tipe Acara</Text>
          <View style={styles.legendGrid}>
            {eventTypes.map(item => (
              <View key={item.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Agenda {selectedDateKey}</Text>
          {loading ? (
            <ActivityIndicator />
          ) : selectedEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Belum ada jadwal.</Text>
            </View>
          ) : (
            selectedEvents.map(evt => (
              <View key={evt.id} style={styles.eventItem}>
                <View style={[styles.legendDot, { backgroundColor: getColor(evt.type), marginRight: 8 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <Text style={styles.eventMeta}>
                    {evt.time || '-'} - {labelType(evt.type)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(evt.id)} style={{ padding: 6 }}>
                  <Feather name="trash-2" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={22} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tambah Event</Text>
            <Text style={styles.label}>Judul</Text>
            <TextInput value={formTitle} onChangeText={setFormTitle} placeholder="Cth: Kontrol Dokter" style={styles.modalInput} />
            <Text style={styles.label}>Waktu</Text>
            <TextInput value={formTime} onChangeText={setFormTime} placeholder="10:00" style={styles.modalInput} />
            <Text style={styles.label}>Jenis</Text>
            <View style={styles.typeRow}>
              {eventTypes.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.typeChip, formType === item.key && { backgroundColor: item.color + '22', borderColor: item.color }]}
                  onPress={() => setFormType(item.key)}>
                  <Text style={{ color: formType === item.key ? item.color : '#0F172A' }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {error ? <Text style={{ color: '#ef4444', marginBottom: 6 }}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                <Text style={{ color: '#0F172A' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddEvent} style={styles.modalSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const buildMonthDays = (anchor: Date) => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const startOffset = start.getDay();
  const totalDays = end.getDate();
  const days: { key: string; date: Date; inMonth: boolean }[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (startOffset - i));
    days.push({ key: toKey(d), date: d, inMonth: false });
  }
  for (let i = 1; i <= (totalDays); i++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), i);
    days.push({ key: toKey(d), date: d, inMonth: true });
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    days.push({ key: toKey(d), date: d, inMonth: false });
  }
  return days;
};

const getColor = (type: EventType) => {
  const map: Record<EventType, string> = {
    appointment: '#3B82F6',
    medication: '#F9A8D4',
    period: '#EF4444',
    checkup: '#22C55E',
  };
  return map[type] || '#94A3B8';
};

const labelType = (type: EventType) => {
  const map: Record<EventType, string> = {
    appointment: 'Appointment',
    medication: 'Medication',
    period: 'Period',
    checkup: 'Check-up',
  };
  return map[type] || type;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef2fb',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: -12,
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
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  monthSwitcher: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  monthLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  navBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayCell: {
    flexBasis: '14.2857%',
    maxWidth: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  daySelected: {},
  dayInnerSelected: {
    backgroundColor: '#e9d5ff',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F472B6',
    marginTop: 3,
  },
  legendCard: {
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  legendTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#475569',
    fontSize: 13,
    marginLeft: 10
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eventTitle: {
    color: '#0F172A',
    fontWeight: '700',
  },
  eventMeta: {
    color: '#6B7280',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#66a5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    paddingBottom: 24,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 8,
  },
  modalInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0F172A',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 6,
  },
  typeChip: {
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalSave: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#66a5ff',
    marginLeft: 10,
  },
});

export default CalendarScreen;
