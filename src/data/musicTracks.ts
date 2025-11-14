export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: 'chill' | 'upbeat' | 'cinematic' | 'lofi' | 'ambient';
  duration: number;
  url: any;
  thumbnailUrl?: string;
  bpm?: number;
  mood?: string[];
  isPremium: boolean;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  // CHILL
  {
    id: 'chill_1',
    title: 'Bliss',
    artist: 'Luke Bergs',
    category: 'chill',
    duration: 180,
    url: require('../../assets/music/chill-1.mp3'),
    bpm: 85,
    mood: ['peaceful', 'calm', 'relaxing'],
    isPremium: false,
  },
  {
    id: 'chill_2',
    title: 'Goodbye',
    artist: 'Luke Bergs',
    category: 'chill',
    duration: 165,
    url: require('../../assets/music/chill-2.mp3'),
    bpm: 78,
    mood: ['mellow', 'warm', 'sunset'],
    isPremium: false,
  },

  // UPBEAT
  {
    id: 'upbeat_1',
    title: 'Island',
    artist: 'Luke Bergs',
    category: 'upbeat',
    duration: 142,
    url: require('../../assets/music/upbeat-1.mp3'),
    bpm: 128,
    mood: ['energetic', 'happy', 'tropical'],
    isPremium: false,
  },
  {
    id: 'upbeat_2',
    title: 'Groovy Vibe',
    artist: 'Fluxx Audio',
    category: 'upbeat',
    duration: 156,
    url: require('../../assets/music/upbeat-2.mp3'),
    bpm: 120,
    mood: ['bright', 'fun', 'groovy'],
    isPremium: false,
  },

  // LOFI
  {
    id: 'lofi_1',
    title: 'Summer Madness',
    artist: 'ROA Music',
    category: 'lofi',
    duration: 195,
    url: require('../../assets/music/lofi-1.mp3'),
    bpm: 75,
    mood: ['focused', 'chill', 'studying'],
    isPremium: false,
  },
  {
    id: 'lofi_2',
    title: 'Dont Talk',
    artist: 'Fluxx Audio',
    category: 'lofi',
    duration: 188,
    url: require('../../assets/music/lofi-2.mp3'),
    bpm: 80,
    mood: ['cozy', 'relaxed', 'ambient'],
    isPremium: false,
  },

  // AMBIENT
  {
    id: 'ambient_1',
    title: 'Running Night',
    artist: 'Fluxx Audio',
    category: 'ambient',
    duration: 240,
    url: require('../../assets/music/ambient-1.mp3'),
    bpm: 60,
    mood: ['spacious', 'meditative', 'calm'],
    isPremium: false,
  },
  {
    id: 'ambient_2',
    title: 'Tell Me What',
    artist: 'Fluxx Audio',
    category: 'ambient',
    duration: 225,
    url: require('../../assets/music/ambient-2.mp3'),
    bpm: 65,
    mood: ['ethereal', 'peaceful', 'floating'],
    isPremium: false,
  },
];