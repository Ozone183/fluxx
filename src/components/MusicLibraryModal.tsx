import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS } from '../theme/colors';
import { MUSIC_LIBRARY, MusicTrack } from '../data/musicTracks';

interface MusicLibraryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTrack: (track: MusicTrack) => void;
  currentTrack?: MusicTrack | null;
}

type Category = 'all' | 'chill' | 'upbeat' | 'cinematic' | 'lofi' | 'ambient';

const MusicLibraryModal: React.FC<MusicLibraryModalProps> = ({
  visible,
  onClose,
  onSelectTrack,
  currentTrack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [filteredTracks, setFilteredTracks] = useState<MusicTrack[]>(MUSIC_LIBRARY);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Filter tracks by category
    if (selectedCategory === 'all') {
      setFilteredTracks(MUSIC_LIBRARY);
    } else {
      setFilteredTracks(MUSIC_LIBRARY.filter(track => track.category === selectedCategory));
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Cleanup sound when modal closes
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPreview = async (track: MusicTrack) => {
    try {
      // Stop currently playing sound
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      // If clicking the same track, just stop
      if (playingTrackId === track.id) {
        setPlayingTrackId(null);
        return;
      }

      setIsLoading(true);

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true, volume: 0.5 },
        (status) => {
          // When sound finishes playing
          if (status.isLoaded && status.didJustFinish) {
            setPlayingTrackId(null);
          }
        }
      );

      setSound(newSound);
      setPlayingTrackId(track.id);
    } catch (error) {
      console.error('Error playing preview:', error);
      Alert.alert('Playback Error', 'Could not play this track');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrack = async (track: MusicTrack) => {
    // Stop preview if playing
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlayingTrackId(null);
    }

    onSelectTrack(track);
    onClose();
  };

  const handleRemoveMusic = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlayingTrackId(null);
    }

    onSelectTrack(null as any); // Remove music from canvas
    onClose();
  };

  const categories: { id: Category; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: 'musical-notes' },
    { id: 'chill', label: 'Chill', icon: 'leaf' },
    { id: 'upbeat', label: 'Upbeat', icon: 'flash' },
    { id: 'lofi', label: 'Lo-fi', icon: 'cafe' },
    { id: 'cinematic', label: 'Cinematic', icon: 'film' },
    { id: 'ambient', label: 'Ambient', icon: 'planet' },
  ];

  const renderTrackItem = ({ item }: { item: MusicTrack }) => {
    const isSelected = currentTrack?.id === item.id;
    const isPlaying = playingTrackId === item.id;

    return (
      <TouchableOpacity
        style={[styles.trackItem, isSelected && styles.trackItemSelected]}
        onPress={() => handleSelectTrack(item)}
        activeOpacity={0.7}
      >
        <View style={styles.trackLeft}>
          {/* Play/Pause Button */}
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={() => handlePlayPreview(item)}
          >
            {isLoading && playingTrackId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={16}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <View style={styles.trackTitleRow}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={10} color={COLORS.amber400} />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {item.artist} • {formatDuration(item.duration)}
            </Text>
            {item.mood && (
              <View style={styles.moodTags}>
                {item.mood.slice(0, 2).map((mood) => (
                  <View key={mood} style={styles.moodTag}>
                    <Text style={styles.moodText}>{mood}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Selected Indicator */}
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.cyan400} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Music Library</Text>
          <View style={styles.headerRight}>
            {currentTrack && (
              <TouchableOpacity onPress={handleRemoveMusic}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === item.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={
                    selectedCategory === item.id
                      ? COLORS.slate900
                      : COLORS.slate400
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item.id && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Track List */}
        <FlatList
          data={filteredTracks}
          keyExtractor={(item) => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.trackList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  closeButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  removeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.red400,
  },
  categoriesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
  },
  categoryChipActive: {
    backgroundColor: COLORS.cyan400,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  categoryTextActive: {
    color: COLORS.slate900,
  },
  trackList: {
    padding: 16,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.slate800,
  },
  trackItemSelected: {
    backgroundColor: COLORS.slate700,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cyan500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: COLORS.cyan400,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.amber400,
  },
  trackArtist: {
    fontSize: 13,
    color: COLORS.slate400,
    marginBottom: 6,
  },
  moodTags: {
    flexDirection: 'row',
    gap: 6,
  },
  moodTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: COLORS.slate700,
  },
  moodText: {
    fontSize: 11,
    color: COLORS.slate300,
  },
  separator: {
    height: 8,
  },
});

export default MusicLibraryModal;
