// src/screens/WatchPartyScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DailyIframe from '@daily-co/react-native-daily-js';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToWatchParty,
  startWatchParty,
  endWatchParty,
  WatchParty,
} from '../services/watchPartyService';

const WatchPartyScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { partyId } = route.params as { partyId: string };
  const { userId, userChannel } = useAuth();

  const [party, setParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(true);
  const [callObject, setCallObject] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);

  // Subscribe to party updates
  useEffect(() => {
    if (!partyId) return;

    const unsubscribe = subscribeToWatchParty(partyId, (updatedParty) => {
      setParty(updatedParty);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partyId]);

  // Initialize Daily.co call
  const joinCall = async () => {
    if (!party?.roomUrl) {
      Alert.alert('Error', 'Room URL not available');
      return;
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
        <TouchableOpacity onPress={leaveCall} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{party.title}</Text>
          <Text style={styles.subtitle}>
            {party.participants.length} / {party.maxParticipants} watching
          </Text>
        </View>
        {isHost && (
          <TouchableOpacity onPress={handleEndParty} style={styles.endButton}>
            <Icon name="close-circle" size={24} color={COLORS.red400} />
          </TouchableOpacity>
        )}
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
});

export default WatchPartyScreen;
