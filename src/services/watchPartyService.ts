// src/services/watchPartyService.ts

import { collection, addDoc, doc, updateDoc, onSnapshot, arrayUnion, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';
import { DAILY_CONFIG } from '../config/dailyConfig';
import { ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '../config/firebase';

export interface WatchParty {
  id: string;
  title: string;
  hostId: string;
  hostUsername: string;
  roomUrl: string;
  roomName: string;
  videoUrl?: string;
  videoTitle?: string;
  status: 'waiting' | 'started' | 'ended';
  participants: string[];
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
        privacy: 'public',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          owner_only_broadcast: false,
          enable_prejoin_ui: false,
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create room');
    }

    return data.url;
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

// Subscribe to active watch parties
export const subscribeToActiveParties = (
  callback: (parties: WatchParty[]) => void
): (() => void) => {
  console.log('🔍 Subscribing to active parties...');
  
  // 🔧 FIX: Use the SAME collection path as createWatchParty!
  const partiesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'watchParties');

  const q = query(
    partiesRef,
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log('📊 Snapshot received:', snapshot.docs.length, 'total parties');
      
      const allParties: WatchParty[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as WatchParty));
      
      // Filter for active parties
      const activeParties = allParties.filter(
        party => party.status === 'waiting' || party.status === 'started'
      );
      
      console.log('✅ Active parties:', activeParties.length);
      callback(activeParties);
    },
    (error) => {
      console.error('❌ Firestore error:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

// Real-time playback sync
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  timestamp: number;
  hostId: string;
}

// Broadcast playback state (HOST ONLY)
export const broadcastPlaybackState = async (
  partyId: string,
  state: Omit<PlaybackState, 'timestamp'>
): Promise<void> => {
  try {
    const playbackRef = ref(realtimeDb, `watchParties/${partyId}/playback`);
    await set(playbackRef, {
      ...state,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error broadcasting playback state:', error);
  }
};

// Subscribe to playback state (ALL USERS)
export const subscribeToPlaybackState = (
  partyId: string,
  callback: (state: PlaybackState | null) => void
): (() => void) => {
  const playbackRef = ref(realtimeDb, `watchParties/${partyId}/playback`);
  
  onValue(playbackRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });

  // Return unsubscribe function
  return () => off(playbackRef);
};

// Participant interface
export interface Participant {
  userId: string;
  username: string;
  active: boolean;
  joinedAt: number;
}

// Update participant count
export const updateParticipantCount = async (
  partyId: string,
  userId: string,
  username: string,
  action: 'join' | 'leave'
): Promise<void> => {
  try {
    const participantRef = ref(realtimeDb, `watchParties/${partyId}/participants/${userId}`);
    
    if (action === 'join') {
      await set(participantRef, {
        userId,
        username,
        joinedAt: serverTimestamp(),
        active: true,
      });
    } else {
      await set(participantRef, {
        userId,
        username,
        active: false,
        leftAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating participant count:', error);
  }
};

// Subscribe to participants with full data
export const subscribeToParticipants = (
  partyId: string,
  callback: (participants: Participant[]) => void
): (() => void) => {
  const participantsRef = ref(realtimeDb, `watchParties/${partyId}/participants`);
  
  onValue(participantsRef, (snapshot) => {
    const data = snapshot.val();
    console.log('👥 Raw participant data:', data);
    if (data) {
      const participants = Object.values(data)
        .filter((p: any) => p.active === true)
        .map((p: any) => ({
          userId: p.userId,
          username: p.username,
          active: p.active,
          joinedAt: p.joinedAt,
        })) as Participant[];
      console.log('👥 Filtered participants:', participants);
      callback(participants);
    } else {
      callback([]);
    }
  });

  return () => off(participantsRef);
};