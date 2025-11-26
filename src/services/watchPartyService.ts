// src/services/watchPartyService.ts

import { collection, addDoc, doc, updateDoc, onSnapshot, arrayUnion, serverTimestamp, Timestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { db } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';
import { DAILY_CONFIG } from '../config/dailyConfig';

export interface WatchParty {
  id: string;
  title: string;
  hostId: string;
  hostUsername: string;
  roomUrl: string;
  roomName: string;
  videoUrl?: string; // URL of video to watch
  videoTitle?: string;
  status: 'waiting' | 'started' | 'ended';
  participants: string[]; // Array of userIds
  maxParticipants: number;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

export interface WatchPartyMember {
  userId: string;
  username: string;
  profilePicUrl?: string;
  joinedAt: number;
  isHost: boolean;
}

// Create a Daily.co room
const createDailyRoom = async (roomName: string): Promise<string> => {
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public', // 👈 Changed from 'private'
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          owner_only_broadcast: false, // 👈 Allow anyone to broadcast
          enable_prejoin_ui: false, // 👈 Skip prejoin screen
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 👈 Room expires in 24 hours
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create room');
    }

    return data.url; // Returns the room URL
  } catch (error) {
    console.error('Create Daily room error:', error);
    throw error;
  }
};

// Create a watch party
export const createWatchParty = async (
  title: string,
  hostId: string,
  hostUsername: string,
  videoUrl?: string,
  videoTitle?: string
): Promise<string> => {
  try {
    const roomName = `fluxx-watch-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Create Daily.co room
    const roomUrl = await createDailyRoom(roomName);
    
    const watchPartyData: Omit<WatchParty, 'id'> = {
      title,
      hostId,
      hostUsername,
      roomUrl,
      roomName,
      videoUrl,
      videoTitle,
      status: 'waiting',
      participants: [hostId],
      maxParticipants: DAILY_CONFIG.roomDefaults.max_participants,
      createdAt: Date.now(),
    };

    const partyRef = await addDoc(
      collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'watchParties'),
      watchPartyData
    );

    console.log('✅ Watch party created:', partyRef.id);
    return partyRef.id;
  } catch (error) {
    console.error('Create watch party error:', error);
    throw error;
  }
};

// Join a watch party
export const joinWatchParty = async (
  partyId: string,
  userId: string
): Promise<void> => {
  try {
    const partyRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'watchParties', partyId);
    
    await updateDoc(partyRef, {
      participants: arrayUnion(userId),
    });

    console.log('✅ Joined watch party:', partyId);
  } catch (error) {
    console.error('Join watch party error:', error);
    throw error;
  }
};

// Start watch party (host only)
export const startWatchParty = async (partyId: string): Promise<void> => {
  try {
    const partyRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'watchParties', partyId);
    
    await updateDoc(partyRef, {
      status: 'started',
      startedAt: Date.now(),
    });

    console.log('✅ Watch party started:', partyId);
  } catch (error) {
    console.error('Start watch party error:', error);
    throw error;
  }
};

// End watch party (host only)
export const endWatchParty = async (partyId: string): Promise<void> => {
  try {
    const partyRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'watchParties', partyId);
    
    await updateDoc(partyRef, {
      status: 'ended',
      endedAt: Date.now(),
    });

    console.log('✅ Watch party ended:', partyId);
  } catch (error) {
    console.error('End watch party error:', error);
    throw error;
  }
};

// Listen to watch party updates
export const subscribeToWatchParty = (
  partyId: string,
  callback: (party: WatchParty) => void
): (() => void) => {
  const partyRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'watchParties', partyId);
  
  return onSnapshot(partyRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as WatchParty);
    }
  });
};

/**
 * Subscribe to active watch parties
 */
export const subscribeToActiveParties = (
  callback: (parties: WatchParty[]) => void
): (() => void) => {
  const partiesRef = collection(db, 'watchParties');
  const activeQuery = query(
    partiesRef,
    where('status', 'in', ['waiting', 'started']),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(activeQuery, (snapshot) => {
    const parties = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WatchParty));
    
    console.log('🎬 Active parties updated:', parties.length);
    callback(parties);
  });

  return unsubscribe;
};
