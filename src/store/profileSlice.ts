import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchProfile, ProfilePayload, saveProfile, updateProfileFields } from '../controllers/profileController';

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

type ProfileState = {
  profile: ProfilePayload | null;
  status: Status;
  error?: string | null;
};

const initialState: ProfileState = {
  profile: null,
  status: 'idle',
  error: null,
};

export const loadProfile = createAsyncThunk<ProfilePayload | null, { uid: string; refreshToken: string }>(
  'profile/load',
  async ({ uid, refreshToken }) => {
    const fields = await fetchProfile(uid, refreshToken);
    if (!fields) return null;
    return {
      uid,
      name: fields?.name?.stringValue,
      email: fields?.email?.stringValue,
      photo: fields?.photo?.stringValue,
      age: fields?.age?.integerValue ? Number(fields.age.integerValue) : undefined,
      heightCm: fields?.heightCm?.integerValue ? Number(fields.heightCm.integerValue) : undefined,
      weightKg: fields?.weightKg?.integerValue ? Number(fields.weightKg.integerValue) : undefined,
      conditions: fields?.conditions?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
      provider: fields?.provider?.stringValue,
    };
  },
);

export const saveProfileDoc = createAsyncThunk<void, { refreshToken: string; data: ProfilePayload }>(
  'profile/saveDoc',
  async ({ refreshToken, data }) => {
    await saveProfile(data, refreshToken);
  },
);

export const updateProfileDoc = createAsyncThunk<
  Partial<ProfilePayload>,
  { uid: string; refreshToken: string; data: Partial<ProfilePayload> }
>('profile/updateDoc', async ({ uid, refreshToken, data }) => {
  await updateProfileFields(uid, refreshToken, data);
  return data;
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileLocal: (state, action: PayloadAction<ProfilePayload | null>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadProfile.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadProfile.fulfilled, (state, action: PayloadAction<ProfilePayload | null>) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.profile = action.payload;
        }
      })
      .addCase(loadProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Gagal memuat profil';
      })
      .addCase(updateProfileDoc.fulfilled, (state, action: PayloadAction<Partial<ProfilePayload>>) => {
        state.profile = state.profile ? { ...state.profile, ...action.payload } : (action.payload as any);
      });
  },
});

export const { setProfileLocal } = profileSlice.actions;
export default profileSlice.reducer;
