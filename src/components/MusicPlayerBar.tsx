import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { COLORS } from '../theme/colors';
import { MusicTrack } from '../data/musicTracks';

interface MusicPlayerBarProps {
  track: MusicTrack;
  onRemove: () => void;
  isCreator: boolean;
}

const MusicPlayerBar: React.FC<MusicPlayerBarProps> = ({
  track,
  onRemove,
  isCreator
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(track.duration * 1000);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    loadSound();

    return () => {
      console.log('🔴 MusicPlayerBar UNMOUNTING for:', track.title);
      if (sound) {
        console.log('🛑 Stopping sound NOW');
        // Make it synchronous and immediate
        sound.stopAsync().catch(() => { });
        sound.unloadAsync().catch(() => { });
        setSound(null);
        setIsPlaying(false);
      }
    };
  }, [track.id, track.url]);

  // Auto-play music when canvas opens
  useEffect(() => {
    if (sound && !isPlaying) {
      const timer = setTimeout(() => {
        sound.playAsync().catch((err) => {
          console.log('Auto-play blocked or failed:', err);
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        // ALSO stop sound here if component unmounts during timer
        if (sound) {
          sound.stopAsync().catch(() => { });
        }
      };
    }
  }, [sound]);

  const loadSound = async () => {
    try {
      setIsLoading(true);

      // Stop and cleanup previous sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPosition(0);
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      console.log('🎵 Loading track:', track.title);

      // Load sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        track.url,
        {
          volume: volume,
          shouldPlay: false,
          isLooping: true  // ✅ ENABLE NATIVE LOOPING
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      console.log('✅ Track loaded successfully:', track.title);
    } catch (error) {
      console.error('❌ Error loading sound:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || track.duration * 1000);
      setIsPlaying(status.isPlaying);

      // ✅ No manual replay needed - isLooping handles it!
      if (status.didJustFinish) {
        console.log('🔁 Song looped automatically');
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRemove = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    onRemove();
  };

  return (
    <View style={styles.container}>
      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Ionicons name="musical-note" size={18} color={COLORS.cyan400} />
        <View style={styles.trackText}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
      </View>

      {/* Playback Controls */}
      <View style={styles.controls}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={COLORS.cyan400}
            maximumTrackTintColor={COLORS.slate600}
            thumbTintColor={COLORS.cyan400}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Volume Icon */}
        <TouchableOpacity style={styles.volumeButton}>
          <Ionicons
            name="volume-medium"
            size={18}
            color={COLORS.slate400}
          />
        </TouchableOpacity>

        {/* Remove Button - CREATOR ONLY */}
        {isCreator && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Ionicons name="close-circle" size={20} color={COLORS.red400} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.slate800,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trackText: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cyan500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.slate400,
    width: 35,
    textAlign: 'center',
  },
  volumeButton: {
    padding: 6,
  },
  removeButton: {
    padding: 6,
  },
});

export default MusicPlayerBar;