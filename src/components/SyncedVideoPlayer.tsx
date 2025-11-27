import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { resolveVideoSource } from '../utils/resolveVideoSource';
import YouTubePlayer from './YouTubePlayer';
import {
  broadcastPlaybackState,
  subscribeToPlaybackState,
  PlaybackState,
} from '../services/watchPartyService';

interface SyncedVideoPlayerProps {
  videoUrl: string;
  isHost: boolean;
  partyId: string; // ADD THIS
  onPlaybackUpdate?: (isPlaying: boolean, positionMillis: number) => void;
  syncedPlaybackState?: {
    isPlaying: boolean;
    positionMillis: number;
    positionSeconds?: number;
  };
}

const SyncedVideoPlayer: React.FC<SyncedVideoPlayerProps> = ({
  videoUrl,
  isHost,
  partyId, // ADD THIS
  onPlaybackUpdate,
  syncedPlaybackState,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use universal video resolver
  const resolvedVideo = resolveVideoSource(videoUrl);

  console.log('🎬 Resolved video:', resolvedVideo.type, resolvedVideo.videoId || resolvedVideo.playableUrl);

  // Format time (ms to MM:SS)
  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show controls temporarily
  const showControlsTemporarily = () => {
    setShowControls(true);

    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }

    // Set new timeout
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      controlsTimeoutRef.current = null;
    }, 3000);
  };

  // Handle native video playback status
const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
  if (status.isLoaded) {
    setIsLoading(false);
    setPosition(status.positionMillis);

    if (status.durationMillis) {
      setDuration(status.durationMillis);
    }

    // Update playing state
    const wasPlaying = isPlaying;
    setIsPlaying(status.isPlaying);

    // When video starts playing, start auto-hide timer
    if (!wasPlaying && status.isPlaying) {
      showControlsTemporarily();
    }

    // When video pauses, show controls and clear timer
    if (wasPlaying && !status.isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    }

    // HOST: Broadcast playback state directly to Firebase
    if (isHost && partyId && status.positionMillis > 0) {
      broadcastPlaybackState(partyId, {
        isPlaying: status.isPlaying,
        currentTime: status.positionMillis / 1000,
        hostId: '',
      });
    }
  }
};

  // Sync native video with host's playback state
  useEffect(() => {
    if (!isHost && resolvedVideo.type === 'mp4' && syncedPlaybackState && videoRef.current) {
      const syncPlayback = async () => {
        try {
          const status = await videoRef.current!.getStatusAsync();

          if (status.isLoaded) {
            if (syncedPlaybackState.isPlaying && !status.isPlaying) {
              await videoRef.current!.playAsync();
            } else if (!syncedPlaybackState.isPlaying && status.isPlaying) {
              await videoRef.current!.pauseAsync();
            }

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
  }, [syncedPlaybackState, isHost, resolvedVideo.type]);

  // Subscribe to playback state (NON-HOSTS)
useEffect(() => {
  if (!isHost && partyId) {
    const unsubscribe = subscribeToPlaybackState(partyId, async (state) => {
      if (!state || isSyncing || isLoading) return;

      console.log('📡 Received playback state:', state);
      setIsSyncing(true);

      try {
        if (resolvedVideo.type === 'mp4' && videoRef.current) {
          const currentStatus = await videoRef.current.getStatusAsync();
          
          if (!currentStatus.isLoaded) {
            setIsSyncing(false);
            return;
          }
          
          // Sync play/pause
          if (state.isPlaying && !currentStatus.isPlaying) {
            await videoRef.current.playAsync();
          } else if (!state.isPlaying && currentStatus.isPlaying) {
            await videoRef.current.pauseAsync();
          }

          // Sync position (if off by more than 5 seconds to avoid loop)
          if (currentStatus.positionMillis) {
            const currentSeconds = currentStatus.positionMillis / 1000;
            const diff = Math.abs(currentSeconds - state.currentTime);
            
            // Only sync if difference is significant
            if (diff > 5) {
              console.log(`⏩ Syncing position: ${currentSeconds}s → ${state.currentTime}s (diff: ${diff.toFixed(1)}s)`);
              await videoRef.current.setPositionAsync(state.currentTime * 1000);
            }
          }
        }
      } catch (error) {
        console.error('Sync error:', error);
      } finally {
        setTimeout(() => setIsSyncing(false), 1000);
      }
    });

    return () => unsubscribe();
  }
}, [isHost, partyId, isSyncing, resolvedVideo.type, isLoading]);

  // Initial sync when joining (set starting position)
useEffect(() => {
  if (!isHost && syncedPlaybackState && videoRef.current && !isLoading) {
    const setInitialPosition = async () => {
      try {
        const status = await videoRef.current!.getStatusAsync();
        
        if (!status.isLoaded) {
          console.log('⏳ Video not loaded yet, waiting...');
          return;
        }

        // Only set position if we're at the beginning and host is ahead
        const currentSeconds = (status.positionMillis || 0) / 1000;
        const targetSeconds = syncedPlaybackState.positionMillis / 1000;
        
        if (currentSeconds < 5 && targetSeconds > 5) {
          console.log('🎬 Setting initial position:', targetSeconds, 'seconds');
          await videoRef.current!.setPositionAsync(syncedPlaybackState.positionMillis);
        }
        
        if (syncedPlaybackState.isPlaying && !status.isPlaying) {
          await videoRef.current!.playAsync();
        }
      } catch (error) {
        console.error('Initial sync error:', error);
      }
    };

    setInitialPosition();
  }
}, [isHost, syncedPlaybackState, isLoading]);

  // Play/Pause toggle for native video
  const togglePlayPause = async () => {
    if (!isHost) return;

    try {
      const status = await videoRef.current?.getStatusAsync();

      if (status?.isLoaded) {
        if (isPlaying) {
          await videoRef.current?.pauseAsync();
          setShowControls(true);

          // Broadcast pause state
          await broadcastPlaybackState(partyId, {
            isPlaying: false,
            currentTime: (status.positionMillis || 0) / 1000,
            hostId: '', // Will be set by service
          });
        } else {
          await videoRef.current?.playAsync();
          showControlsTemporarily();

          // Broadcast play state
          await broadcastPlaybackState(partyId, {
            isPlaying: true,
            currentTime: (status.positionMillis || 0) / 1000,
            hostId: '', // Will be set by service
          });
        }
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  // Render YouTube player
  if (resolvedVideo.type === 'youtube' && resolvedVideo.videoId) {
    return (
      <YouTubePlayer
        videoId={resolvedVideo.videoId}
        isHost={isHost}
        onPlaybackUpdate={(isPlaying, positionSeconds) => {
          if (isHost && onPlaybackUpdate) {
            onPlaybackUpdate(isPlaying, positionSeconds * 1000);
          }
        }}
        syncedPlaybackState={
          syncedPlaybackState
            ? {
              isPlaying: syncedPlaybackState.isPlaying,
              positionSeconds: syncedPlaybackState.positionMillis / 1000,
            }
            : undefined
        }
      />
    );
  }

  // Render native video player for MP4/M3U8
  return (
    <View style={styles.container}>
      {/* Tap overlay for controls toggle */}
      <TouchableOpacity
        style={styles.tapOverlay}
        activeOpacity={1}
        onPress={() => {
          console.log('🎬 Screen tapped!');
          if (showControls) {
            console.log('🔽 Hiding controls');
            setShowControls(false);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
          } else {
            console.log('🔼 Showing controls');
            showControlsTemporarily();
          }
        }}
      />

      <Video
        ref={videoRef}
        source={{ uri: resolvedVideo.playableUrl || videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        useNativeControls={false}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {!isLoading && isHost && showControls && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            console.log('▶️ Play/Pause button tapped!');
            togglePlayPause();
            showControlsTemporarily();
          }}
          activeOpacity={0.7}
        >
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={48}
            color={COLORS.white}
          />
        </TouchableOpacity>
      )}

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

      {isHost && (
        <View style={styles.hostBadge}>
          <Icon name="star" size={14} color={COLORS.amber400} />
          <Text style={styles.hostBadgeText}>You're the host</Text>
        </View>
      )}

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
  webview: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
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
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    zIndex: 2,
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