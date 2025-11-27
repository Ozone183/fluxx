import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
// @ts-ignore
import { DailyMediaView } from '@daily-co/react-native-daily-js';

interface CollapsibleVideoTilesProps {
  callObject: any;
  participantCount: number;
}

const CollapsibleVideoTiles: React.FC<CollapsibleVideoTilesProps> = ({
  callObject,
  participantCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!callObject) return;

    const updateParticipants = () => {
      const participantsObj = callObject.participants();
      const participantsList = Object.values(participantsObj);
      setParticipants(participantsList);
      console.log('👥 Video participants:', participantsList.length);
    };

    // Initial load
    updateParticipants();

    // Listen for participant changes
    callObject.on('participant-joined', updateParticipants);
    callObject.on('participant-left', updateParticipants);
    callObject.on('participant-updated', updateParticipants);

    return () => {
      callObject.off('participant-joined', updateParticipants);
      callObject.off('participant-left', updateParticipants);
      callObject.off('participant-updated', updateParticipants);
    };
  }, [callObject]);

  if (!callObject) return null;

  return (
    <View style={styles.container}>
      {!isExpanded ? (
        // Minimized button
        <TouchableOpacity
          style={styles.minimizedButton}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.8}
        >
          <Icon name="videocam" size={20} color={COLORS.white} />
          <Text style={styles.participantCountText}>{participantCount}</Text>
        </TouchableOpacity>
      ) : (
        // Expanded video grid
        <View style={styles.expandedContainer}>
          <View style={styles.expandedHeader}>
            <Text style={styles.expandedTitle}>Watching ({participants.length})</Text>
            <TouchableOpacity
              onPress={() => setIsExpanded(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.videoGrid}>
              {participants.map((participant: any) => {
                const isLocal = participant.local;
                const userName = participant.user_name || (isLocal ? 'You' : 'Guest');
                const videoTrack = participant.tracks?.video;
                const audioMuted = !participant.audio;
                
                return (
                  <View key={participant.session_id} style={styles.videoTile}>
                    {videoTrack?.state === 'playable' ? (
  <DailyMediaView
    videoTrack={videoTrack}
    audioTrack={participant.tracks?.audio}
    mirror={isLocal}
    objectFit="cover"
    style={styles.videoView}
  />
) : (
  <View style={styles.videoPlaceholder}>
    <Icon 
      name={videoTrack?.off ? 'videocam-off' : 'person'} 
      size={32} 
      color={videoTrack?.off ? COLORS.red400 : COLORS.slate600} 
    />
    {videoTrack?.off && (
      <Text style={styles.cameraOffText}>Camera Off</Text>
    )}
  </View>
)}
                    
                    <View style={styles.videoOverlay}>
                      <Text style={styles.videoTileLabel} numberOfLines={1}>
                        {userName}
                      </Text>
                      {audioMuted && (
                        <Icon name="mic-off" size={12} color={COLORS.red400} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    right: 16,
    zIndex: 100,
  },
  minimizedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  participantCountText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  expandedContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 16,
    padding: 12,
    minWidth: 280,
    maxWidth: 320,
    maxHeight: 400,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandedTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.slate700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    maxHeight: 320,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  videoTile: {
    width: 126,
    height: 95,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.slate800,
    position: 'relative',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoTileLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  cameraOffText: {
    color: COLORS.red400,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default CollapsibleVideoTiles;
