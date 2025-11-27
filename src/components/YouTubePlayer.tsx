import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../theme/colors';

interface YouTubePlayerProps {
  videoId: string;
  isHost: boolean;
  onPlaybackUpdate?: (isPlaying: boolean, positionSeconds: number) => void;
  syncedPlaybackState?: {
    isPlaying: boolean;
    positionSeconds: number;
  };
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  isHost,
  onPlaybackUpdate,
  syncedPlaybackState,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Generate YouTube IFrame Player API HTML
  const getYouTubeHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * { margin: 0; padding: 0; border: 0; }
            body, html { width: 100%; height: 100%; background: #000; overflow: hidden; }
            #player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="player"></div>
          <script src="https://www.youtube.com/iframe_api"></script>
          <script>
            var player;
            var isReady = false;
            
            function onYouTubeIframeAPIReady() {
              player = new YT.Player('player', {
  videoId: '${videoId}',
  host: 'https://www.youtube-nocookie.com',
  playerVars: {
    autoplay: 0,
    controls: 1,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
    fs: 1,
    enablejsapi: 1,
    origin: window.location.origin
  },
                events: {
                  onReady: onPlayerReady,
                  onStateChange: onPlayerStateChange
                }
              });
            }
            
            function onPlayerReady(event) {
              isReady = true;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ready'
              }));
              
              // Start time update interval
              setInterval(function() {
                if (player && player.getCurrentTime) {
                  var currentTime = player.getCurrentTime();
                  var duration = player.getDuration();
                  var state = player.getPlayerState();
                  
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'timeUpdate',
                    currentTime: currentTime,
                    duration: duration,
                    state: state
                  }));
                }
              }, 500);
            }
            
            function onPlayerStateChange(event) {
              var state = event.data;
              var stateString = 'unknown';
              
              if (state === YT.PlayerState.PLAYING) stateString = 'playing';
              else if (state === YT.PlayerState.PAUSED) stateString = 'paused';
              else if (state === YT.PlayerState.ENDED) stateString = 'ended';
              else if (state === YT.PlayerState.BUFFERING) stateString = 'buffering';
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'stateChange',
                state: stateString,
                currentTime: player.getCurrentTime()
              }));
            }
            
            // Commands from React Native
            window.addEventListener('message', function(event) {
              if (!isReady || !player) return;
              
              try {
                var data = JSON.parse(event.data);
                
                if (data.command === 'play') {
                  player.playVideo();
                } else if (data.command === 'pause') {
                  player.pauseVideo();
                } else if (data.command === 'seekTo' && data.time !== undefined) {
                  player.seekTo(data.time, true);
                }
              } catch (e) {
                console.error('Command error:', e);
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  // Send commands to YouTube player
  const sendCommand = (command: string, params?: any) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ command, ...params });
      webViewRef.current.postMessage(message);
      console.log('📺 Sending YouTube command:', command, params);
    }
  };

  // Handle messages from YouTube player
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📺 YouTube message:', data.type, data);

      if (data.type === 'ready') {
        setIsLoading(false);
        console.log('✅ YouTube player ready');
      } else if (data.type === 'stateChange') {
        const playing = data.state === 'playing';
        setIsPlaying(playing);

        if (isHost && onPlaybackUpdate) {
          onPlaybackUpdate(playing, data.currentTime || 0);
        }
      } else if (data.type === 'timeUpdate') {
        setCurrentTime(data.currentTime || 0);

        if (isHost && onPlaybackUpdate && data.state === 1) {
          onPlaybackUpdate(true, data.currentTime || 0);
        }
      }
    } catch (error) {
      console.error('YouTube message error:', error);
    }
  };

  // Sync with host's playback state (for joiners)
  useEffect(() => {
    if (!isHost && syncedPlaybackState) {
      console.log('�� Syncing to host state:', syncedPlaybackState);

      // Sync play/pause
      if (syncedPlaybackState.isPlaying && !isPlaying) {
        sendCommand('play');
      } else if (!syncedPlaybackState.isPlaying && isPlaying) {
        sendCommand('pause');
      }

      // Sync position (if drift > 3 seconds)
      const drift = Math.abs(currentTime - syncedPlaybackState.positionSeconds);
      if (drift > 3) {
        console.log(`⏩ Seeking to ${syncedPlaybackState.positionSeconds}s (drift: ${drift}s)`);
        sendCommand('seekTo', { time: syncedPlaybackState.positionSeconds });
      }
    }
  }, [syncedPlaybackState, isHost]);

  return (
    <View style={styles.container}>
      <WebView
  ref={webViewRef}
  source={{ 
    html: getYouTubeHTML(),
    baseUrl: 'https://www.youtube.com'
  }}
  style={styles.webview}
  allowsInlineMediaPlayback={true}
  mediaPlaybackRequiresUserAction={false}
  javaScriptEnabled={true}
  domStorageEnabled={true}
  allowsFullscreenVideo={true}
  onMessage={handleMessage}
  originWhitelist={['*']}
  mixedContentMode="always"
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
          <Text style={styles.hostBadgeText}>🎬 YouTube • Host</Text>
        </View>
      )}

      {/* Synced Badge (Non-Host) */}
      {!isHost && (
        <View style={styles.syncedBadge}>
          <Text style={styles.syncedBadgeText}>🎬 YouTube • Synced</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
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
  hostBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
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

export default YouTubePlayer;
