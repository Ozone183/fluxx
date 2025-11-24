import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullscreenVideoModalProps {
  visible: boolean;
  videoUrl: string;
  thumbnailUrl?: string;
  onClose: () => void;
}

export default function FullscreenVideoModal({
  visible,
  videoUrl,
  thumbnailUrl,
  onClose,
}: FullscreenVideoModalProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<any>(null);

  // Auto-play when modal opens
  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [visible]);

  // Cleanup video from memory when unmounting
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Auto-hide controls after 3 seconds
  const resetHideControlsTimer = () => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    setShowControls(true);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Hide controls when playing starts
  useEffect(() => {
    if (isPlaying) {
      resetHideControlsTimer();
    } else {
      setShowControls(true);
    }
  }, [isPlaying]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

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

  const handleClose = async () => {
    // Stop and unload video before closing
    if (videoRef.current) {
      await videoRef.current.stopAsync();
      await videoRef.current.unloadAsync();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          usePoster={!!thumbnailUrl}
          posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
          posterStyle={{ resizeMode: 'contain' } as any}
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color={COLORS.cyan400} />
            <Text style={styles.bufferingText}>Loading...</Text>
          </View>
        )}

        {/* Controls Overlay */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowControls(!showControls);
            if (!showControls) {
              resetHideControlsTimer();
            }
          }}
          style={styles.controlsContainer}
        >
          {showControls && (
            <>
              {/* Top Controls - Close & Mute */}
              <View style={styles.topControls}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.controlButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconBackground}>
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <View style={styles.spacer} />

                <TouchableOpacity
                  onPress={toggleMute}
                  style={styles.controlButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconBackground}>
                    <Ionicons
                      name={isMuted ? 'volume-mute' : 'volume-high'}
                      size={28}
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
                    size={64}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              {/* Bottom Controls - Progress Bar */}
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
            </>
          )}
        </TouchableOpacity>

        {/* Tap to close hint */}
        {showControls && (
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap × to close</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bufferingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  controlButton: {
    padding: 4,
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  playButtonBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
  tapHint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    alignSelf: 'center',
  },
  tapHintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});