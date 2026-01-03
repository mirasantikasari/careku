import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CalendarEvent, addEvent, deleteEvent, fetchEventsForMonth } from '../controllers/calendarController';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type CalendarState = {
  eventsByMonth: Record<string, CalendarEvent[]>;
  status: Status;
  error?: string | null;
};

const initialState: CalendarState = {
  eventsByMonth: {},
  status: 'idle',
  error: null,
};

export const fetchMonthEvents = createAsyncThunk<
  { monthKey: string; events: CalendarEvent[] },
  { uid: string; refreshToken: string; start: string; end: string; monthKey: string }
>('calendar/fetchMonth', async ({ uid, refreshToken, start, end, monthKey }) => {
  const events = await fetchEventsForMonth(uid, refreshToken, start, end);
  return { monthKey, events };
});

export const addCalendarEvent = createAsyncThunk<
  { monthKey: string; event: CalendarEvent },
  { uid: string; refreshToken: string; monthKey: string; data: Omit<CalendarEvent, 'id'> }
>('calendar/add', async ({ uid, refreshToken, monthKey, data }) => {
  const event = await addEvent(uid, refreshToken, data);
  return { monthKey, event };
});

export const deleteCalendarEvent = createAsyncThunk<
  { monthKey: string; eventId: string },
  { uid: string; refreshToken: string; monthKey: string; eventId: string }
>('calendar/delete', async ({ uid, refreshToken, monthKey, eventId }) => {
  await deleteEvent(uid, refreshToken, eventId);
  return { monthKey, eventId };
});

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchMonthEvents.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMonthEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.eventsByMonth[action.payload.monthKey] = action.payload.events;
      })
      .addCase(fetchMonthEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Gagal memuat event';
      })
      .addCase(addCalendarEvent.fulfilled, (state, action) => {
        const list = state.eventsByMonth[action.payload.monthKey] || [];
        state.eventsByMonth[action.payload.monthKey] = [...list, action.payload.event];
      })
      .addCase(deleteCalendarEvent.fulfilled, (state, action) => {
        const list = state.eventsByMonth[action.payload.monthKey] || [];
        state.eventsByMonth[action.payload.monthKey] = list.filter(e => e.id !== action.payload.eventId);
      });
  },
});

export default calendarSlice.reducer;

