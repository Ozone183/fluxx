// src/config/dailyConfig.ts

export const DAILY_CONFIG = {
  apiKey: '1bbe47e3af02d20017a07725f949c21e0947169653c4bf266d827c887681624c',
  
  // Daily.co configuration
  domain: 'fluxx.daily.co', // You can customize this in Daily dashboard
  
  // Room settings
  roomDefaults: {
    privacy: 'private', // private or public
    max_participants: 10, // Free tier supports up to 10
    enable_screenshare: true,
    enable_chat: false, // We'll build our own
    enable_recording: false, // Can enable later
    start_video_off: false,
    start_audio_off: false,
  },
  
  // Video quality settings
  videoSettings: {
    width: 640,
    height: 480,
    frameRate: 30,
  },
};
