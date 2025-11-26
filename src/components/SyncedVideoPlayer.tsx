import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { WebView } from 'react-native-webview';
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

// Helper: Extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Helper: Check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper: Check if URL is Tubi
const isTubiUrl = (url: string): boolean => {
  return url.includes('tubitv.com');
};

// Helper: Extract Tubi video ID
const getTubiVideoId = (url: string): string | null => {
  const match = url.match(/tubitv\.com\/(movies|tv-shows)\/(\d+)/);
  return match ? match[2] : null;
};

const SyncedVideoPlayer: React.FC<SyncedVideoPlayerProps> = ({
  videoUrl,
  isHost,
  onPlaybackUpdate,
  syncedPlaybackState,
}) => {
  const videoRef = useRef<Video>(null);
  const webViewRef = useRef<WebView>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

  const isTubi = isTubiUrl(videoUrl);
  const tubiVideoId = isTubi ? getTubiVideoId(videoUrl) : null;

  // DEBUG
  console.log('🔍 Video URL:', videoUrl);
  console.log('🔍 Is YouTube?:', isYouTube);
  console.log('🔍 YouTube Video ID:', youtubeVideoId);
  console.log('🔍 Is Tubi?:', isTubi);
  console.log('🔍 Tubi Video ID:', tubiVideoId);



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

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Handle native video playback status
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);

      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }

      // Auto-hide controls when playing
      if (status.isPlaying) {
        showControlsTemporarily();
      } else {
        // Keep controls visible when paused
        setShowControls(true);
      }

      if (isHost && onPlaybackUpdate) {
        onPlaybackUpdate(status.isPlaying, status.positionMillis);
      }
    }
  };

  // Sync native video with host's playback state
  useEffect(() => {
    if (!isHost && !isYouTube && syncedPlaybackState && videoRef.current) {
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
  }, [syncedPlaybackState, isHost, isYouTube]);

  // Play/Pause toggle for native video
  const togglePlayPause = async () => {
    if (!isHost) return;

    try {
      if (isPlaying) {
        await videoRef.current?.pauseAsync();
        setShowControls(true);
      } else {
        await videoRef.current?.playAsync();
        showControlsTemporarily();
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  };

  // YouTube WebView control
  const sendYouTubeCommand = (command: string) => {
    console.log('🎬 Sending YouTube command:', command);
    if (webViewRef.current) {
      const script = `
        console.log('📺 Executing command: ${command}');
        if (window.player) {
          console.log('✅ Player exists, calling ${command}');
          window.player.${command}();
          true;
        } else {
          console.log('❌ Player not found!');
          false;
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    } else {
      console.log('❌ WebView ref not found!');
    }
  };

  // YouTube player HTML
  const getYouTubeHTML = () => {
    if (!youtubeVideoId) return '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              margin: 0;
              padding: 0;
              border: 0;
            }
            body, html {
              width: 100%;
              height: 100%;
              background-color: #000;
              overflow: hidden;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe
            src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1&controls=1&modestbranding=1&rel=0&enablejsapi=1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            frameborder="0"
          ></iframe>
        </body>
      </html>
    `;
  };

  // Tubi player HTML
  const getTubiHTML = () => {
    if (!tubiVideoId) return '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              border: 0;
            }
            body, html {
              width: 100%;
              height: 100%;
              background-color: #000;
              overflow: hidden;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe
            src="https://tubitv.com/embed/${tubiVideoId}"
            allowfullscreen
            frameborder="0"
            allow="autoplay; fullscreen"
          ></iframe>
        </body>
      </html>
    `;
  };

  // Handle YouTube WebView messages
  const handleYouTubeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📺 YouTube message:', data);

      if (data.type === 'ready') {
        setIsLoading(false);
        console.log('✅ YouTube player ready');
      } else if (data.type === 'stateChange') {
        console.log('🎬 YouTube state changed:', data.state);
        // 1 = playing, 2 = paused
        const playing = data.state === 1;
        setIsPlaying(playing);

        if (isHost && onPlaybackUpdate) {
          onPlaybackUpdate(playing, data.time * 1000);
        }
      } else if (data.type === 'timeUpdate') {
        setPosition(data.time * 1000);
        setDuration(data.duration * 1000);
      }
    } catch (error) {
      console.error('YouTube message error:', error);
    }
  };

  // Render Tubi player
  if (isTubi && tubiVideoId) {
    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: getTubiHTML() }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.cyan400} />
            <Text style={styles.loadingText}>Loading Tubi...</Text>
          </View>
        )}

        {/* Host Badge */}
        {isHost && (
          <View style={styles.hostBadge}>
            <Icon name="film" size={16} color="#FA541C" />
            <Text style={styles.hostBadgeText}>Tubi • Host</Text>
          </View>
        )}

        {/* Synced Badge (Non-Host) */}
        {!isHost && (
          <View style={styles.syncedBadge}>
            <Icon name="film" size={16} color="#FA541C" />
            <Text style={styles.syncedBadgeText}>Tubi • Synced</Text>
          </View>
        )}
      </View>
    );
  }

  // Render YouTube player
  if (isYouTube && youtubeVideoId) {
    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ html: getYouTubeHTML() }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          onMessage={handleYouTubeMessage}
          userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.cyan400} />
            <Text style={styles.loadingText}>Loading YouTube video...</Text>
          </View>
        )}

        {/* Host Badge */}
        {isHost && (
          <View style={styles.hostBadge}>
            <Icon name="logo-youtube" size={16} color="#FF0000" />
            <Text style={styles.hostBadgeText}>YouTube • Host</Text>
          </View>
        )}

        {/* Synced Badge (Non-Host) */}
        {!isHost && (
          <View style={styles.syncedBadge}>
            <Icon name="logo-youtube" size={16} color="#FF0000" />
            <Text style={styles.syncedBadgeText}>YouTube • Synced</Text>
          </View>
        )}
      </View>
    );
  }

  // Render native video player
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => {
        if (isHost) {
          if (showControls) {
            setShowControls(false);
          } else {
            showControlsTemporarily();
          }
        }
      }}
    >
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
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

      {!isLoading && isHost && (
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => {
            showControlsTemporarily();
            togglePlayPause();
          }}
          activeOpacity={0.7}
        >
          {showControls && (
            <View style={styles.playButton}>
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color={COLORS.white}
              />
            </View>
          )}
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
    </TouchableOpacity>
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
  youtubePlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

});

export default SyncedVideoPlayer;