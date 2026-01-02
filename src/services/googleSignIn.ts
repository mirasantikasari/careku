import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { UserProfile } from '../context/AuthContext';
import { GOOGLE_WEB_CLIENT_ID as FILE_WEB_CLIENT_ID } from '../config/env';

const envWebClientId = (globalThis as any)?.process?.env?.GOOGLE_WEB_CLIENT_ID as
  | string
  | undefined;
const WEB_CLIENT_ID = envWebClientId || FILE_WEB_CLIENT_ID || '';

let configured = false;

export const ensureConfigured = () => {
  if (!WEB_CLIENT_ID) {
    throw new Error('GOOGLE_WEB_CLIENT_ID belum diset di .env');
  }
  if (configured) return;

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });

  configured = true;
};

export const signInWithGoogleToken = async (): Promise<{
  idToken: string;
  email?: string;
  profile: UserProfile;
}> => {
  ensureConfigured();

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const result = await GoogleSignin.signIn();

  const profile: UserProfile = {
    id: result.data?.user?.id,
    name: result.data?.user?.name,
    email: result.data?.user?.email,
    photo: result.data?.user?.photo,
    givenName: result.data?.user?.givenName,
    familyName: result.data?.user?.familyName,
  };

  const idToken = result.data?.idToken;
  const email = result.data?.user?.email;

  if (!idToken) {
    throw new Error('Tidak menerima token Google');
  }

  return { idToken, email, profile };
};
