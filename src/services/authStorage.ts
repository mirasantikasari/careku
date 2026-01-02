import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@careku:idToken';
const REFRESH_KEY = '@careku:refreshToken';

export const storeToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getStoredToken = async () => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const storeRefreshToken = async (token: string) => {
  await AsyncStorage.setItem(REFRESH_KEY, token);
};

export const getStoredRefreshToken = async () => {
  return AsyncStorage.getItem(REFRESH_KEY);
};

export const clearRefreshToken = async () => {
  await AsyncStorage.removeItem(REFRESH_KEY);
};
