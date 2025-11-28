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
import FullscreenVideoModal from './FullscreenVideoModal';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  onView?: () => void;
  style?: ViewStyle;
  autoPlay?: boolean;
  isPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

export default function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  onView,
  style,
  autoPlay = false,
  isPlaying: externalIsPlaying,
  onPlayingChange,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true); // ✅ MUTE BY DEFAULT
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showFullscreen, setShowFullscreen] = useState(false); // ✅ NEW
  const hideControlsTimeout = useRef<any>(null);

  // Cleanup video from memory when unmounting
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {
          // Ignore errors on unmount
        });
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

  // Sync with external playing state
  useEffect(() => {
    if (externalIsPlaying === true && !isPlaying) {
      // Start playing when told to
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else if (externalIsPlaying === false && isPlaying) {
      // Stop playing when told to
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [externalIsPlaying]);

  // Hide controls when playing starts
  useEffect(() => {
    if (isPlaying) {
      resetHideControlsTimer();
    } else {
      setShowControls(true);
    }
  }, [isPlaying]);

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
      // Video is still loading, this is normal during autoplay
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
      if (onPlayingChange) {
        onPlayingChange(true);
      }
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

  // ✅ NEW: Open fullscreen
  const handleFullscreen = async () => {
    // Pause the current video
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
    }
    setShowFullscreen(true);
  };

  // ✅ NEW: Close fullscreen and resume
  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
    // Resume playing in the feed
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  };

  return (
    <>
      <View style={[styles.container, style]}>
      <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={autoPlay}
          isLooping
          isMuted={true}  // ✅ ALWAYS START MUTED
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          usePoster={!!thumbnailUrl}
          posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
          posterStyle={{ resizeMode: 'cover' } as any}
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={styles.bufferingContainer}>
            <ActivityIndicator size="large" color={COLORS.cyan400} />
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

                {/* ✅ NEW: Fullscreen Button */}
                <TouchableOpacity
                  onPress={handleFullscreen}
                  style={styles.fullscreenButton}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconBackground}>
                    <Ionicons
                      name="expand"
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
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ NEW: Fullscreen Modal */}
      <FullscreenVideoModal
        visible={showFullscreen}
        videoUrl={videoUrl}
        thumbnailUrl={thumbnailUrl}
        onClose={handleCloseFullscreen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
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
    justifyContent: 'space-between',
    padding: 12,
  },
  muteButton: {
    padding: 4,
  },
  fullscreenButton: {
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