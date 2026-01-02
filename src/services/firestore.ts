import { getFirebaseApiKey } from './firebaseAuth';
import { FIREBASE_PROJECT_ID as FILE_PROJECT_ID } from '../config/env';

const envProjectId = (globalThis as any)?.process?.env?.FIREBASE_PROJECT_ID as string | undefined;
const PROJECT_ID = envProjectId || FILE_PROJECT_ID || '';
export const getBaseUrl = () => {
  if (!PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID belum diset.');
  }
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
};
const tokenEndpoint = 'https://securetoken.googleapis.com/v1/token';

type FirestoreProfilePayload = {
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

const toValue = (val: any) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return { integerValue: Math.round(val) };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(item => ({ stringValue: String(item) })),
      },
    };
  }
  return undefined;
};

export const getAccessTokenFromRefreshToken = async (refreshToken: string) => {
  const API_KEY = getFirebaseApiKey();
  if (!API_KEY) {
    throw new Error('FIREBASE_API_KEY belum diset.');
  }

  const res = await fetch(`${tokenEndpoint}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || 'Gagal menukar refresh token';
    throw new Error(msg);
  }

  return data?.access_token as string;
};

export const saveUserProfileWithRefreshToken = async (
  profile: FirestoreProfilePayload,
  refreshToken: string,
) => {
  const API_KEY = getFirebaseApiKey();
  if (!API_KEY || !PROJECT_ID) {
    throw new Error('FIREBASE_API_KEY atau FIREBASE_PROJECT_ID belum diset.');
  }

  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  const fields: Record<string, any> = {
    uid: toValue(profile.uid),
    createdAt: { timestampValue: new Date().toISOString() },
  };

  const optionalEntries: Array<[string, any]> = [
    ['name', profile.name],
    ['email', profile.email],
    ['photo', profile.photo],
    ['age', profile.age],
    ['heightCm', profile.heightCm],
    ['weightKg', profile.weightKg],
    ['provider', profile.provider],
    ['conditions', profile.conditions],
  ];

  optionalEntries.forEach(([key, value]) => {
    const mapped = toValue(value);
    if (mapped) {
      fields[key] = mapped;
    }
  });

  const document = { fields };

  const res = await fetch(`${getBaseUrl()}/users?documentId=${profile.uid}&key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(document),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal menyimpan profil ke Firestore: ${body}`);
  }
};

export const fetchUserDocument = async (uid: string, refreshToken: string) => {
  const API_KEY = getFirebaseApiKey();
  if (!API_KEY || !PROJECT_ID) {
    throw new Error('FIREBASE_API_KEY atau FIREBASE_PROJECT_ID belum diset.');
  }

  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);
  const res = await fetch(`${getBaseUrl()}/users/${uid}?key=${API_KEY}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal mengambil data user: ${body}`);
  }

  return res.json();
};

export const updateUserFields = async (
  uid: string,
  refreshToken: string,
  fieldsToUpdate: Record<string, any>,
) => {
  const API_KEY = getFirebaseApiKey();
  if (!API_KEY || !PROJECT_ID) {
    throw new Error('FIREBASE_API_KEY atau FIREBASE_PROJECT_ID belum diset.');
  }

  const accessToken = await getAccessTokenFromRefreshToken(refreshToken);

  const fields: Record<string, any> = {};
  const updateMask: string[] = [];

  Object.entries(fieldsToUpdate).forEach(([key, value]) => {
    const mapped = toValue(value);
    if (mapped) {
      fields[key] = mapped;
      updateMask.push(`updateMask.fieldPaths=${key}`);
    }
  });

  const query = updateMask.length ? `?${updateMask.join('&')}&key=${API_KEY}` : `?key=${API_KEY}`;

  const res = await fetch(`${getBaseUrl()}/users/${uid}${query}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal memperbarui data user: ${body}`);
  }

  return res.json();
};
