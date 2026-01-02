import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  id?: string;
  name?: string | null;
  email?: string;
  photo?: string | null;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  givenName?: any;
  familyName?: any;
  conditions?: string[];
};

type AuthContextType = {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const saved = await AsyncStorage.getItem('user_profile');
      if (saved) {
        setProfileState(JSON.parse(saved));
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const setProfile = async (user: UserProfile | null) => {
    if (user) {
      await AsyncStorage.setItem('user_profile', JSON.stringify(user));
      setProfileState(user);
    } else {
      await AsyncStorage.removeItem('user_profile');
      setProfileState(null);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setProfileState(null);
  };

  // 🔑 PENTING: Provider TIDAK BOLEH render teks
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ profile, setProfile, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
