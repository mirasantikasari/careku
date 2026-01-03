import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DailyMetric, HomeData, getHomeData, getMetricsRange, updateHomeData } from '../controllers/homeController';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type HomeState = {
  data: HomeData;
  status: Status;
  error?: string | null;
  metrics: DailyMetric[];
  metricsStatus: Status;
  metricsError?: string | null;
};

const initialState: HomeState = {
  data: { mood: undefined, waterIntake: 0, painLevel: 0 },
  status: 'idle',
  error: null,
  metrics: [],
  metricsStatus: 'idle',
  metricsError: null,
};

export const fetchHome = createAsyncThunk<HomeData, { uid: string; refreshToken: string }>(
  'home/fetch',
  async ({ uid, refreshToken }) => {
    return getHomeData(uid, refreshToken);
  },
);

export const saveHome = createAsyncThunk<HomeData, { uid: string; refreshToken: string; data: Partial<HomeData> }>(
  'home/save',
  async ({ uid, refreshToken, data }) => {
    await updateHomeData(uid, refreshToken, data);
    // return merged data to update store quickly
    return data;
  },
);

export const fetchMetrics = createAsyncThunk<
  DailyMetric[],
  { uid: string; refreshToken: string; start: string; end: string }
>('home/fetchMetrics', async ({ uid, refreshToken, start, end }) => {
  return getMetricsRange(uid, refreshToken, start, end);
});

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchHome.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHome.fulfilled, (state, action: PayloadAction<HomeData>) => {
        state.status = 'succeeded';
        state.data = { ...state.data, ...action.payload };
      })
      .addCase(fetchHome.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Gagal memuat home data';
      })
      .addCase(saveHome.fulfilled, (state, action: PayloadAction<HomeData>) => {
        state.data = { ...state.data, ...action.payload };
      })
      .addCase(fetchMetrics.pending, state => {
        state.metricsStatus = 'loading';
        state.metricsError = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action: PayloadAction<DailyMetric[]>) => {
        state.metricsStatus = 'succeeded';
        state.metrics = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.metricsStatus = 'failed';
        state.metricsError = action.error.message || 'Gagal memuat statistik';
      });
  },
});

export default homeSlice.reducer;
