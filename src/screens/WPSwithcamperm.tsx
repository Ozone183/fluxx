// src/screens/WatchPartyScreen.tsx
// 🔥 CAMERA PERMISSION FIX APPLIED

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Clipboard } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DailyIframe from '@daily-co/react-native-daily-js';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { AppState } from 'react-native';
import VideoPickerModal from '../components/VideoPickerModal';
import SyncedVideoPlayer from '../components/SyncedVideoPlayer';
import CollapsibleVideoTiles from '../components/CollapsibleVideoTiles';
// 🔥 REMOVED: import { Camera } from 'expo-camera';
import {
  subscribeToWatchParty,
  startWatchParty,
  endWatchParty,
  createWatchParty,
  WatchParty,
  subscribeToActiveParties,
  updateParticipantCount,
  subscribeToParticipants,
  Participant,
} from '../services/watchPartyService';

const WatchPartyScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, userChannel } = useAuth();

  const partyId = (route.params as any)?.partyId;

  const [party, setParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(true);
  const [callObject, setCallObject] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [activeParties, setActiveParties] = useState<WatchParty[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const channelName = userChannel || 'Anonymous';

  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const [playbackState, setPlaybackState] = useState<{
    isPlaying: boolean;
    positionMillis: number;
  }>({
    isPlaying: false,
    positionMillis: 0,
  });

  // Subscribe to party updates
  useEffect(() => {
    if (!partyId) {
      setLoading(false);

      if (callObject) {
        callObject.destroy().catch(() => { });
        setCallObject(null);
        setIsInCall(false);
      }

      return;
    }

    console.log('🎬 Subscribing to party:', partyId);
    setLoading(true);

    const unsubscribe = subscribeToWatchParty(partyId, (updatedParty) => {
      console.log('✅ Party data received:', updatedParty);
      setParty(updatedParty);
      setLoading(false);
    });

    return () => {
      unsubscribe();

      if (callObject) {
        callObject.destroy().catch(() => { });
        setCallObject(null);
        setIsInCall(false);
      }
    };
  }, [partyId, callObject]);

  // Subscribe to all active parties
  useEffect(() => {
    const unsubscribe = subscribeToActiveParties((parties) => {
      setActiveParties(parties);
    });

    return () => unsubscribe();
  }, []);

  // Cleanup call object on unmount
  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.destroy();
      }
    };
  }, [callObject]);

  // Track participant join/leave
  useEffect(() => {
    if (partyId && userId && channelName) {
      // Mark as joined
      updateParticipantCount(partyId, userId, channelName, 'join');

      // Subscribe to participants
      const unsubscribe = subscribeToParticipants(partyId, (participantsList) => {
        console.log('👥 Participants:', participantsList);
        setParticipants(participantsList);
      });

      // Mark as left on cleanup
      return () => {
        console.log('🚪 User leaving party');
        updateParticipantCount(partyId, userId, channelName, 'leave');
        unsubscribe();
      };
    }
  }, [partyId, userId, channelName]);

  // Handle app going to background/closing
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && partyId && userId && channelName) {
        console.log('📱 App going to background, marking user as left');
        updateParticipantCount(partyId, userId, channelName, 'leave');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [partyId, userId, channelName]);

  // 🔥 FIXED: Request permissions (Daily.co will handle this)
  const requestPermissions = async () => {
    // Daily.co will request permissions when we call join()
    // We just need to make sure we enable camera/mic after joining
    return true;
  };

  // 🔥 FIXED: Join Daily.co call with camera/mic force-enabled
  const joinCall = async () => {
    if (!party?.roomUrl) {
      Alert.alert('Error', 'Room URL not available');
      return;
    }

    try {
      setLoading(true);

      if (callObject) {
        await callObject.destroy();
        setCallObject(null);
      }

      const daily = DailyIframe.createCallObject();
      setCallObject(daily);

      daily.on('joined-meeting', async () => {
        console.log('✅ Joined meeting');
        setIsInCall(true);
        setLoading(false);

        // 🔥 CRITICAL: Force camera and mic ON after joining
        try {
          console.log('📹 Enabling camera and microphone...');
          await daily.setLocalVideo(true);
          await daily.setLocalAudio(true);
          console.log('✅ Camera and mic enabled!');
        } catch (error) {
          console.error('❌ Failed to enable camera/mic:', error);
        }
      });

      daily.on('left-meeting', () => {
        console.log('👋 Left meeting');
        setIsInCall(false);
      });

      daily.on('error', (error: any) => {
        console.error('❌ Daily error:', error);
        Alert.alert('Connection Error', error.errorMsg || 'Could not connect to call');
        setLoading(false);
      });

      // 🔥 IMPORTANT: Tell Daily.co to request camera/mic permissions
      await daily.join({
        url: party.roomUrl,
        userName: userChannel || 'Anonymous',
      });

      // 🔥 CRITICAL: Immediately enable camera/mic after join (backup)
      setTimeout(async () => {
        try {
          await daily.setLocalVideo(true);
          await daily.setLocalAudio(true);
          console.log('✅ Camera/mic enabled via setTimeout');
        } catch (error) {
          console.error('Failed setTimeout enable:', error);
        }
      }, 1000);

    } catch (error) {
      console.error('Join call error:', error);
      Alert.alert('Error', 'Could not join watch party');
      setLoading(false);
    }
  };

  // Leave call
  const leaveCall = async () => {
    try {
      if (callObject) {
        await callObject.leave();
        await callObject.destroy();
        setCallObject(null);
        setIsInCall(false);
      }
    } catch (error) {
      console.error('Leave call error:', error);
      setCallObject(null);
      setIsInCall(false);
    }
    navigation.goBack();
  };

  // Toggle microphone
  const toggleMic = async () => {
    if (!callObject) return;

    try {
      const newMutedState = !isMicMuted;
      await callObject.setLocalAudio(!newMutedState);
      setIsMicMuted(newMutedState);
      console.log('🎤 Mic', newMutedState ? 'MUTED' : 'UNMUTED');
    } catch (error) {
      console.error('Toggle mic error:', error);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    if (!callObject) return;

    try {
      const newCameraState = !isCameraOff;
      await callObject.setLocalVideo(!newCameraState);
      setIsCameraOff(newCameraState);
      console.log('📹 Camera', newCameraState ? 'OFF' : 'ON');
    } catch (error) {
      console.error('Toggle camera error:', error);
    }
  };

  // Leave with confirmation
  const leaveCallWithConfirmation = () => {
    Alert.alert(
      'Leave Watch Party?',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: leaveCall,
        },
      ]
    );
  };

  // Start party (host only)
  const handleStartParty = async () => {
    if (!partyId) return;

    try {
      await startWatchParty(partyId);
      Alert.alert('🎉 Party Started!', 'Everyone can now join the watch party');
    } catch (error) {
      Alert.alert('Error', 'Could not start party');
    }
  };

  // End party (host only)
  const handleEndParty = async () => {
    if (!partyId) return;

    Alert.alert(
      'End Watch Party?',
      'This will end the party for everyone',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Party',
          style: 'destructive',
          onPress: async () => {
            try {
              await endWatchParty(partyId);
              await leaveCall();
            } catch (error) {
              Alert.alert('Error', 'Could not end party');
            }
          },
        },
      ]
    );
  };

  const isHost = party?.hostId === userId;

  // Browse screen (no partyId)
  if (!partyId) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Watch Parties 🎬</Text>
            <Text style={styles.subtitle}>
              {activeParties.length} active {activeParties.length === 1 ? 'party' : 'parties'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createIconButton}
            onPress={() => setShowVideoPicker(true)}
          >
            <Icon name="add-circle" size={28} color={COLORS.cyan400} />
          </TouchableOpacity>
        </View>

        {/* Active Parties List */}
        {activeParties.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="film-outline" size={80} color={COLORS.slate600} />
            <Text style={styles.emptyTitle}>No Active Parties</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to start watching together!
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.partiesList}>
            {activeParties.map((activeParty) => (
              <TouchableOpacity
                key={activeParty.id}
                style={styles.partyCard}
                onPress={() => {
                  navigation.setParams({ partyId: activeParty.id } as any);
                }}
              >
                <View style={styles.partyCardLeft}>
                  <View style={styles.partyIconContainer}>
                    <Icon name="film" size={24} color={COLORS.cyan400} />
                  </View>
                  <View style={styles.partyCardInfo}>
                    <Text style={styles.partyCardTitle}>{activeParty.title}</Text>
                    <Text style={styles.partyCardHost}>by @{activeParty.hostUsername}</Text>
                    {activeParty.videoTitle && (
                      <Text style={styles.partyCardMovie} numberOfLines={1}>
                        🎬 {activeParty.videoTitle}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.partyCardRight}>
                  <View style={styles.participantBadge}>
                    <Icon name="people" size={16} color={COLORS.cyan400} />
                    <Text style={styles.participantBadgeText}>
                      {activeParty.participants.length}/{activeParty.maxParticipants}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    activeParty.status === 'started' ? styles.statusActive : styles.statusWaiting
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {activeParty.status === 'started' ? '🔴 Live' : '⏸️ Lobby'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Video Picker Modal */}
        <VideoPickerModal
          visible={showVideoPicker}
          onClose={() => setShowVideoPicker(false)}
          onSelectVideo={async (videoUrl, videoTitle) => {
            try {
              setLoading(true);
              setShowVideoPicker(false);

              const newPartyId = await createWatchParty(
                'Movie Night 🍿',
                userId!,
                userChannel || '@unknown',
                videoUrl,
                videoTitle
              );

              console.log('✅ Watch party created:', newPartyId);
              navigation.setParams({ partyId: newPartyId } as any);

            } catch (error) {
              console.error('❌ Create party error:', error);
              Alert.alert('Error', 'Could not create watch party');
              setLoading(false);
            }
          }}
        />
      </View>
    );
  }

  if (loading || !party) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading watch party...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (isInCall) {
              leaveCall();
            } else {
              navigation.setParams({ partyId: undefined } as any);
            }
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{party.title}</Text>
          <Text style={styles.subtitle}>
            {participants.length} / {party.maxParticipants} watching
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              try {
                Clipboard.setString(`fluxx://watchparty/${partyId}`);
                Alert.alert('🎉 Invite Link Copied!', 'Share it with friends to watch together!');
              } catch (error) {
                Alert.alert('Error', 'Could not copy invite link');
              }
            }}
            style={styles.shareButton}
          >
            <Icon name="share-social" size={22} color={COLORS.cyan400} />
          </TouchableOpacity>

          {isHost && (
            <TouchableOpacity onPress={handleEndParty} style={styles.endButton}>
              <Icon name="close-circle" size={24} color={COLORS.red400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lobby or Video Player */}
      {!isInCall ? (
        <View style={styles.lobbyContainer}>
          <Icon name="videocam" size={80} color={COLORS.cyan400} />
          <Text style={styles.lobbyTitle}>Ready to watch?</Text>
          <Text style={styles.lobbySubtitle}>
            {party.videoTitle || 'Join the watch party'}
          </Text>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={joinCall}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Icon name="play-circle" size={24} color={COLORS.white} />
                <Text style={styles.joinButtonText}>Join Watch Party</Text>
              </>
            )}
          </TouchableOpacity>

          {isHost && party.status === 'waiting' && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartParty}
            >
              <Text style={styles.startButtonText}>Start Party</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <View style={styles.videoPlayerContainer}>
            <SyncedVideoPlayer
              videoUrl={party.videoUrl || ''}
              isHost={isHost}
              partyId={partyId}
              onPlaybackUpdate={(isPlaying, positionMillis) => {
                setPlaybackState({ isPlaying, positionMillis });
              }}
              syncedPlaybackState={!isHost ? playbackState : undefined}
            />
          </View>

          <CollapsibleVideoTiles
            callObject={callObject}
            participantCount={participants.length}
          />
        </>
      )}

      {/* Controls */}
      {isInCall && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isMicMuted && styles.mutedButton]}
            onPress={toggleMic}
          >
            <Icon
              name={isMicMuted ? 'mic-off' : 'mic'}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, isCameraOff && styles.mutedButton]}
            onPress={toggleCamera}
          >
            <Icon
              name={isCameraOff ? 'videocam-off' : 'videocam'}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="chatbubbles" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.leaveButton]}
            onPress={leaveCallWithConfirmation}
          >
            <Icon name="exit" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 2,
  },
  endButton: {
    padding: 8,
  },
  lobbyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 24,
  },
  lobbySubtitle: {
    fontSize: 16,
    color: COLORS.slate400,
    marginTop: 8,
    textAlign: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cyan500,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 32,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  startButton: {
    backgroundColor: COLORS.purple500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.slate800,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.slate700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: COLORS.red500,
  },
  createIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partiesList: {
    flex: 1,
  },
  partyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  partyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.slate700,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partyCardInfo: {
    flex: 1,
  },
  partyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  partyCardHost: {
    fontSize: 14,
    color: COLORS.cyan400,
    marginBottom: 2,
  },
  partyCardMovie: {
    fontSize: 13,
    color: COLORS.slate400,
  },
  partyCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.slate700,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: COLORS.red500,
  },
  statusWaiting: {
    backgroundColor: COLORS.slate700,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 8,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantTiles: {
    position: 'absolute',
    top: 80,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: 250,
    gap: 8,
  },
  participantText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  participantChip: {
    backgroundColor: COLORS.cyan400,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  participantName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  mutedButton: {
    backgroundColor: COLORS.red500,
  },
});

export default WatchPartyScreen;
