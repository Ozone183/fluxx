import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../theme/colors';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onView?: () => void;
  style?: ViewStyle;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  onView,
  style,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    if (isPlaying && !hasViewed && onView) {
      onView();
      setHasViewed(true);
    }
  }, [isPlaying, hasViewed, onView]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Video error:', status.error);
      }
      return;
    }

    setIsBuffering(status.isBuffering);
    setIsPlaying(status.isPlaying);
    setIsMuted(status.isMuted);
    
    if (status.durationMillis) {
      setDuration(status.durationMillis);
    }
    
    if (status.positionMillis !== undefined) {
      setPosition(status.positionMillis);
    }

    // Loop video when it ends
    if (status.didJustFinish) {
      videoRef.current?.replayAsync();
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    await videoRef.current.setIsMutedAsync(!isMuted);
  };

  const handleSliderValueChange = async (value: number) => {
    if (!videoRef.current) return;
    const seekPosition = value * duration;
    await videoRef.current.setPositionAsync(seekPosition);
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={autoPlay}
        isLooping
        isMuted={isMuted}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        usePoster={!!thumbnailUrl}
        posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
        posterStyle={styles.poster}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <View style={styles.bufferingContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
        </View>
      )}

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            onPress={toggleMute}
            style={styles.muteButton}
            activeOpacity={0.8}
          >
            <View style={styles.iconBackground}>
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={24}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Center Play/Pause Button */}
        <TouchableOpacity
          onPress={togglePlayPause}
          style={styles.centerButton}
          activeOpacity={0.8}
        >
          <View style={styles.playButtonBackground}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={48}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={duration > 0 ? position / duration : 0}
              onSlidingComplete={handleSliderValueChange}
              minimumTrackTintColor={COLORS.cyan400}
              maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
              thumbTintColor={COLORS.cyan400}
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  muteButton: {
    padding: 4,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  playButtonBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
});
