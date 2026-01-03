import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ReminderPayload,
  fetchReminders as fetchRemindersApi,
  saveReminder,
  updateReminderEnabled,
} from '../controllers/remindersController';

export type ReminderItem = {
  id: string;
  title: string;
  time: string;
  repeat: string;
  type: string;
  enabled: boolean;
  createdAt?: string;
};

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type RemindersState = {
  items: ReminderItem[];
  status: Status;
  error?: string | null;
};

const initialState: RemindersState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchReminders = createAsyncThunk<
  ReminderItem[],
  { uid: string; refreshToken: string }
>('reminders/fetchAll', async ({ uid, refreshToken }) => {
  const data = await fetchRemindersApi(uid, refreshToken);
  return data.map(item => ({
    id: item.id || `${Date.now()}`,
    title: item.title,
    time: item.time,
    repeat: item.repeat || 'Daily',
    type: item.type,
    enabled: item.enabled ?? true,
    createdAt: item.createdAt,
  }));
});

export const addReminder = createAsyncThunk<
  ReminderItem,
  { refreshToken: string; payload: ReminderPayload }
>('reminders/add', async ({ refreshToken, payload }) => {
  const saved = await saveReminder(payload, refreshToken);
  return {
    id: saved.id || `${Date.now()}`,
    title: saved.title,
    time: saved.time,
    repeat: saved.repeat,
    type: saved.type,
    enabled: saved.enabled ?? true,
    createdAt: saved.createdAt,
  };
});

export const toggleReminder = createAsyncThunk<
  { id: string; enabled: boolean },
  { uid: string; refreshToken: string; reminderId: string; enabled: boolean }
>('reminders/toggle', async ({ uid, refreshToken, reminderId, enabled }) => {
  await updateReminderEnabled(uid, reminderId, enabled, refreshToken);
  return { id: reminderId, enabled };
});

const remindersSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    clearReminders: state => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchReminders.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action: PayloadAction<ReminderItem[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Gagal memuat reminder';
      })
      .addCase(addReminder.fulfilled, (state, action: PayloadAction<ReminderItem>) => {
        state.items = [action.payload, ...state.items];
      })
      .addCase(toggleReminder.fulfilled, (state, action) => {
        state.items = state.items.map(item =>
          item.id === action.payload.id ? { ...item, enabled: action.payload.enabled } : item,
        );
      });
  },
});

export const { clearReminders } = remindersSlice.actions;
export default remindersSlice.reducer;
