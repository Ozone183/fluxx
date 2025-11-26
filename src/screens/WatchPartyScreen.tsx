// src/screens/WatchPartyScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,  // 👈 ADD THIS
} from 'react-native';
import { Clipboard } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DailyIframe from '@daily-co/react-native-daily-js';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import VideoPickerModal from '../components/VideoPickerModal';
import {
  subscribeToWatchParty,
  startWatchParty,
  endWatchParty,
  createWatchParty,  // 👈 ADD THIS
  WatchParty,
  subscribeToActiveParties,  // 👈 ADD THIS
} from '../services/watchPartyService';

const WatchPartyScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, userChannel } = useAuth();
  
  // 👈 REACTIVE: Read partyId dynamically, not just once
  const partyId = (route.params as any)?.partyId;

  const [party, setParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(true);
  const [callObject, setCallObject] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [activeParties, setActiveParties] = useState<WatchParty[]>([]);

  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Subscribe to party updates
  useEffect(() => {
    if (!partyId) {
      setLoading(false);
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
      console.log('🧹 Cleaning up subscription');
      unsubscribe();
    };
  }, [partyId]); // 👈 This will now trigger when partyId changes

  // Subscribe to all active parties (for browsing)
  useEffect(() => {
    const unsubscribe = subscribeToActiveParties((parties) => {
      setActiveParties(parties);
    });

    return () => unsubscribe();
  }, []);

  // Initialize Daily.co call
  const joinCall = async () => {
    if (!party?.roomUrl) {
      Alert.alert('Error', 'Room URL not available');
      return;
    }

    // 👇 PREVENT DUPLICATE CALLS
    if (callObject) {
      console.log('⚠️ Already in a call, cleaning up first...');
      await callObject.destroy();
      setCallObject(null);
    }

    try {
      setLoading(true);

      // Create call object
      const daily = DailyIframe.createCallObject();
      setCallObject(daily);

      // Add event listeners
      daily.on('joined-meeting', () => {
        console.log('✅ Joined meeting');
        setIsInCall(true);
        setLoading(false);
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

      // Join the room
      await daily.join({
        url: party.roomUrl,
        userName: userChannel || 'Anonymous',
      });

    } catch (error) {
      console.error('Join call error:', error);
      Alert.alert('Error', 'Could not join watch party');
      setLoading(false);
    }
  };

  // Leave call
  const leaveCall = async () => {
    if (callObject) {
      await callObject.leave();
      await callObject.destroy();
      setCallObject(null);
      setIsInCall(false);
    }
    navigation.goBack();
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

  // NEW: Show browse screen if no partyId
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
            onPress={() => {
              console.log('🎬 + button tapped!');
              console.log('📹 Opening video picker...');
              setShowVideoPicker(true);
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="add-circle" size={28} color={COLORS.cyan400} />
            )}
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

        {/* 🎬 VIDEO PICKER MODAL */}
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
            // If in call, leave the call
            if (isInCall) {
              leaveCall();
            } else {
              // Otherwise, go back to browse screen
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
            {party.participants.length} / {party.maxParticipants} watching
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* SHARE BUTTON */}
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
          
          {/* END PARTY BUTTON (host only) */}
          {isHost && (
            <TouchableOpacity onPress={handleEndParty} style={styles.endButton}>
              <Icon name="close-circle" size={24} color={COLORS.red400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
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
          <View style={styles.callContainer}>
            <Text style={styles.callText}>
              🎬 In Call (Daily.co video will render here)
            </Text>
            <Text style={styles.callSubtext}>
              Video rendering coming in next step!
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      {isInCall && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="mic" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="videocam" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="share-social" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.leaveButton]}
            onPress={leaveCall}
          >
            <Icon name="call" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
      {/* 🎬 VIDEO PICKER MODAL - ADD HERE */}
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
  videoContainer: {
    flex: 1,
    backgroundColor: COLORS.slate800,
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
  callContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  callSubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 8,
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
  orText: {
    fontSize: 16,
    color: COLORS.slate400,
    marginVertical: 16,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cyan400,
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
});

export default WatchPartyScreen;
