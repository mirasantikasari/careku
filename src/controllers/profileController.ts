import {
  fetchUserDocument,
  saveUserProfileWithRefreshToken,
  updateUserFields,
} from '../services/firestore';

export type ProfilePayload = {
  uid: string;
  name?: string;
  email?: string;
  photo?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  conditions?: string[];
  provider?: string;
};

export const fetchProfile = async (uid: string, refreshToken: string) => {
  const doc = await fetchUserDocument(uid, refreshToken);
  return doc?.fields || null;
};

export const saveProfile = async (profile: ProfilePayload, refreshToken: string) => {
  await saveUserProfileWithRefreshToken(profile, refreshToken);
};

export const updateProfileFields = async (
  uid: string,
  refreshToken: string,
  fields: Partial<ProfilePayload>,
) => {
  await updateUserFields(uid, refreshToken, fields as Record<string, any>);
};
