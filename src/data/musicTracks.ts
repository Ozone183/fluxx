export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: 'chill' | 'upbeat' | 'cinematic' | 'lofi' | 'ambient';
  duration: number;
  url: string;
  thumbnailUrl?: string;
  bpm?: number;
  mood?: string[];
  isPremium: boolean;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  // CHILL CATEGORY
  {
    id: 'chill_1',
    title: 'Peaceful Morning',
    artist: 'Fluxx Audio',
    category: 'chill',
    duration: 180,
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    bpm: 85,
    mood: ['peaceful', 'calm', 'relaxing'],
    isPremium: false,
  },
  {
    id: 'chill_2',
    title: 'Sunset Vibes',
    artist: 'Fluxx Audio',
    category: 'chill',
    duration: 165,
    url: 'https://cdn.pixabay.com/audio/2023/04/12/audio_8b0d3f5c8e.mp3',
    bpm: 78,
    mood: ['mellow', 'sunset', 'warm'],
    isPremium: false,
  },
  
  // UPBEAT CATEGORY
  {
    id: 'upbeat_1',
    title: 'Energy Boost',
    artist: 'Fluxx Audio',
    category: 'upbeat',
    duration: 142,
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c5c3c7c5d0.mp3',
    bpm: 128,
    mood: ['energetic', 'happy', 'positive'],
    isPremium: false,
  },
  {
    id: 'upbeat_2',
    title: 'Summer Days',
    artist: 'Fluxx Audio',
    category: 'upbeat',
    duration: 156,
    url: 'https://cdn.pixabay.com/audio/2023/06/15/audio_9f1e7b2a3c.mp3',
    bpm: 120,
    mood: ['bright', 'fun', 'cheerful'],
    isPremium: false,
  },
  
  // LOFI CATEGORY
  {
    id: 'lofi_1',
    title: 'Study Session',
    artist: 'Fluxx Audio',
    category: 'lofi',
    duration: 195,
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_d1718e6b98.mp3',
    bpm: 75,
    mood: ['focused', 'chill', 'studying'],
    isPremium: false,
  },
  {
    id: 'lofi_2',
    title: 'Coffee Shop',
    artist: 'Fluxx Audio',
    category: 'lofi',
    duration: 188,
    url: 'https://cdn.pixabay.com/audio/2023/01/20/audio_5e9f8b1d2a.mp3',
    bpm: 80,
    mood: ['cozy', 'relaxed', 'ambient'],
    isPremium: false,
  },
  
  // CINEMATIC CATEGORY
  {
    id: 'cinematic_1',
    title: 'Epic Journey',
    artist: 'Fluxx Audio',
    category: 'cinematic',
    duration: 210,
    url: 'https://cdn.pixabay.com/audio/2022/11/28/audio_3a8f9c5e7b.mp3',
    bpm: 90,
    mood: ['dramatic', 'powerful', 'inspiring'],
    isPremium: true,
  },
  {
    id: 'cinematic_2',
    title: 'Dreamscape',
    artist: 'Fluxx Audio',
    category: 'cinematic',
    duration: 198,
    url: 'https://cdn.pixabay.com/audio/2023/02/14/audio_7c2d9e1f3b.mp3',
    bpm: 70,
    mood: ['ethereal', 'emotional', 'cinematic'],
    isPremium: true,
  },
  
  // AMBIENT CATEGORY
  {
    id: 'ambient_1',
    title: 'Deep Space',
    artist: 'Fluxx Audio',
    category: 'ambient',
    duration: 240,
    url: 'https://cdn.pixabay.com/audio/2022/09/15/audio_1f8c9b2d4e.mp3',
    bpm: 60,
    mood: ['spacious', 'meditative', 'calm'],
    isPremium: false,
  },
  {
    id: 'ambient_2',
    title: 'Forest Walk',
    artist: 'Fluxx Audio',
    category: 'ambient',
    duration: 225,
    url: 'https://cdn.pixabay.com/audio/2023/03/08/audio_9e1d7f2c5a.mp3',
    bpm: 65,
    mood: ['nature', 'peaceful', 'grounding'],
    isPremium: false,
  },
];
