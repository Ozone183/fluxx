import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from './AuthContext';

interface Profile {
  userId: string;
  channel: string;
  profilePictureUrl: string | null;
}

interface ProfileContextType {
  allProfiles: { [key: string]: Profile };
  getProfile: (userId: string) => Profile | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allProfiles, setAllProfiles] = useState<{ [key: string]: Profile }>({});

  useEffect(() => {
    const profilesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles');
    
    const unsubscribe = onSnapshot(profilesRef, (snapshot) => {
      const profiles: { [key: string]: Profile } = {};
      snapshot.docs.forEach(doc => {
        profiles[doc.id] = doc.data() as Profile;
      });
      setAllProfiles(profiles);
    });

    return () => unsubscribe();
  }, []);

  const getProfile = (userId: string) => allProfiles[userId] || null;

  return (
    <ProfileContext.Provider value={{ allProfiles, getProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfiles must be used within ProfileProvider');
  return context;
};
