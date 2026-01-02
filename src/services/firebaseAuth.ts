import { Platform } from 'react-native';
import { FIREBASE_API_KEY as FILE_API_KEY } from '../config/env';

type SignInResponse = {
  idToken: string;
  refreshToken: string;
  email: string;
  expiresIn: string;
  localId: string;
};

const envKey = (globalThis as any)?.process?.env?.FIREBASE_API_KEY as string | undefined;
// Priority: runtime env -> generated env file. No hardcoded fallback to force .env usage.
const FIREBASE_API_KEY = envKey || FILE_API_KEY || '';

const passwordEndpoint = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
const idpEndpoint = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp';
const signUpEndpoint = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp';

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<SignInResponse> => {
  if (!FIREBASE_API_KEY) {
    throw new Error(
      'FIREBASE_API_KEY belum diset. Tambahkan env atau isi langsung di firebaseAuth.ts',
    );
  }

  const res = await fetch(`${passwordEndpoint}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    const message =
      data?.error?.message === 'INVALID_PASSWORD'
        ? 'Email atau password salah.'
        : data?.error?.message === 'EMAIL_NOT_FOUND'
          ? 'Email belum terdaftar.'
          : data?.error?.message === 'USER_DISABLED'
            ? 'Akun dinonaktifkan. Hubungi admin.'
            : 'Gagal login ke Firebase. Coba lagi.';
    throw new Error(message);
  }

  return data as SignInResponse;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
): Promise<SignInResponse> => {
  if (!FIREBASE_API_KEY) {
    throw new Error(
      'FIREBASE_API_KEY belum diset. Tambahkan env atau isi langsung di firebaseAuth.ts',
    );
  }

  const res = await fetch(`${signUpEndpoint}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const data = await res.json();
  if (!res.ok) {
    const code = data?.error?.message;
    const message =
      code === 'EMAIL_EXISTS'
        ? 'Email sudah terdaftar. Coba login.'
        : code === 'OPERATION_NOT_ALLOWED'
          ? 'Pendaftaran email/password belum diaktifkan.'
          : code === 'TOO_MANY_ATTEMPTS_TRY_LATER'
            ? 'Terlalu banyak percobaan. Coba lagi nanti.'
            : 'Gagal mendaftar. Coba lagi.';
    throw new Error(message);
  }

  return data as SignInResponse;
};

export const signInWithGoogleIdToken = async (idToken: string): Promise<SignInResponse> => {
  if (!FIREBASE_API_KEY) {
    throw new Error('FIREBASE_API_KEY belum diset. Tambahkan env atau isi di firebaseAuth.ts');
  }

  const res = await fetch(`${idpEndpoint}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `id_token=${idToken}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnIdpCredential: true,
      returnSecureToken: true,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const code = data?.error?.message;
    const message =
      code === 'INVALID_IDP_RESPONSE'
        ? 'Token Google tidak valid.'
        : 'Gagal login dengan Google. Coba lagi.';
    throw new Error(message);
  }

  return data as SignInResponse;
};

export const getFirebaseInfo = () =>
  `Firebase REST Auth (${Platform.OS})`;

export const getFirebaseApiKey = () => FIREBASE_API_KEY;
