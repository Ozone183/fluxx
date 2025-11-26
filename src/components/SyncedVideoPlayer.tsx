import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface SyncedVideoPlayerProps {
  videoUrl: string;
  isHost: boolean;
  onPlaybackUpdate?: (isPlaying: boolean, positionMillis: number) => void;
  syncedPlaybackState?: {
    isPlaying: boolean;
    positionMillis: number;
  };
}

const SyncedVideoPlayer: React.FC<SyncedVideoPlayerProps> = ({
  videoUrl,
  isHost,
  onPlaybackUpdate,
  syncedPlaybackState,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format time (ms to MM:SS)
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle playback status update
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }

      // Only host broadcasts playback state
      if (isHost && onPlaybackUpdate) {
        onPlaybackUpdate(status.isPlaying, status.positionMillis);
      }
    }
  };

  // Sync with host's playback state (for non-hosts)
  useEffect(() => {
    if (!isHost && syncedPlaybackState && videoRef.current) {
      const syncPlayback = async () => {
        try {
          const status = await videoRef.current!.getStatusAsync();
          
          if (status.isLoaded) {
            // Sync play/pause
            if (syncedPlaybackState.isPlaying && !status.isPlaying) {
              await videoRef.current!.playAsync();
            } else if (!syncedPlaybackState.isPlaying && status.isPlaying) {
              await videoRef.current!.pauseAsync();
            }

            // Sync position (if difference > 2 seconds)
            const positionDiff = Math.abs(status.positionMillis - syncedPlaybackState.positionMillis);
            if (positionDiff > 2000) {
              await videoRef.current!.setPositionAsync(syncedPlaybackState.positionMillis);
            }
          }
        } catch (error) {
          console.error('Sync error:', error);
        }
      };

      syncPlayback();
    }
  }, [syncedPlaybackState, isHost]);

  // Show controls temporarily
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Hide after 3 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Play/Pause toggle (host only)
  const togglePlayPause = async () => {
    if (!isHost) return;

    try {
      if (isPlaying) {
        await videoRef.current?.pauseAsync();
        setShowControls(true); // Keep controls visible when paused
      } else {
        await videoRef.current?.playAsync();
        showControlsTemporarily(); // Auto-hide when playing
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        useNativeControls={false}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

{/* Play/Pause Overlay (Host Only) */}
{!isLoading && isHost && (
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => {
            showControlsTemporarily();
            togglePlayPause();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.playButton}>
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={48}
              color={COLORS.white}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Video Progress Bar */}
      {!isLoading && showControls && (
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(position / duration) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      )}

      {/* Host Badge */}
      {isHost && (
        <View style={styles.hostBadge}>
          <Icon name="star" size={14} color={COLORS.amber400} />
          <Text style={styles.hostBadgeText}>You're the host</Text>
        </View>
      )}

      {/* Synced Badge (Non-Host) */}
      {!isHost && (
        <View style={styles.syncedBadge}>
          <Icon name="sync" size={14} color={COLORS.cyan400} />
          <Text style={styles.syncedBadgeText}>Synced with host</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.cyan400,
  },
  timeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  hostBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hostBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  syncedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  syncedBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SyncedVideoPlayer;
