import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore } from '../config/firebase';

const APP_ID = 'fluxx-app-2025';

interface AuthContextType {
  userId: string | null;
  isAuthReady: boolean;
  isProfileSetup: boolean;
  userChannel: string | null;
  userProfilePic: string | null;
  setUserProfile: (channel: string, profilePic: string | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileSetup, setIsProfileSetup] = useState(false);
  const [userChannel, setUserChannel] = useState<string | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const profileDocRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', user.uid);
        const profileDoc = await getDoc(profileDocRef);

        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserChannel(data?.channel || null);
          setUserProfilePic(data?.profilePictureUrl || null);
          setIsProfileSetup(true);
        }
      } else {
        setUserId(null);
        setIsProfileSetup(false);
        setUserChannel(null);
        setUserProfilePic(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const setUserProfile = async (channel: string, profilePic: string | null) => {
    setUserChannel(channel);
    setUserProfilePic(profilePic);
    setIsProfileSetup(true);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // Reset onboarding flag to show splash screen again on next login
    await AsyncStorage.removeItem('hasSeenOnboarding');
    setUserId(null);
    setUserChannel(null);
    setUserProfilePic(null);
    setIsProfileSetup(false);
  };

  return (
    <AuthContext.Provider value={{ userId, isAuthReady, isProfileSetup, userChannel, userProfilePic, setUserProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export { APP_ID };