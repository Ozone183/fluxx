import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ViewToken,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselViewerProps {
    images: string[]; // Array of image URLs
    musicUrl?: string; // Optional background music URL
    musicTitle?: string; // Optional music title to display
    onImageChange?: (index: number) => void;
    autoPlayMusic?: boolean; // Auto-play music when carousel appears
    pauseMusic?: boolean; // External control to pause music
  }

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

export const ImageCarouselViewer: React.FC<ImageCarouselViewerProps> = ({
    images,
    musicUrl,
    musicTitle,
    onImageChange,
    autoPlayMusic = false,
    pauseMusic = false,
  }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Initialize audio mode on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };

    setupAudio();
  }, []);

  // Load and play music
  useEffect(() => {
    if (musicUrl && autoPlayMusic && !sound && !pauseMusic) {
      loadAndPlayMusic();
    }

    return () => {
      // Cleanup sound on unmount
      if (sound) {
        sound.unloadAsync().catch(console.error);
        setSound(null);
        setIsPlaying(false);
      }
    };
  }, [musicUrl, autoPlayMusic, pauseMusic]);

  // Handle external pause control
  useEffect(() => {
    if (pauseMusic && sound) {
      // Stop and unload when scrolling away
      sound.unloadAsync().catch(console.error);
      setSound(null);
      setIsPlaying(false);
    }
  }, [pauseMusic, sound]);

  const loadAndPlayMusic = async () => {
    if (!musicUrl) {
      console.log('⚠️ No music URL provided');
      return;
    }
    
    if (sound) {
      console.log('⚠️ Sound already loaded');
      return;
    }

    console.log('🎵 Loading music from:', musicUrl);
    setIsMusicLoading(true);
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: musicUrl },
        { shouldPlay: true, isLooping: true, volume: 0.6 },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
      console.log('✅ Music loaded and playing');
    } catch (error) {
      // Only log once, not spam the console
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('⚠️ Music file not found (404). Using placeholder music.');
      } else {
        console.error('❌ Error loading music:', error);
      }
      setIsPlaying(false);
      setSound(null); // Clear sound reference on error
    } finally {
      setIsMusicLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const toggleMusic = async () => {
    try {
      if (!sound) {
        // Load and play if not loaded yet
        console.log('🎵 Loading music for first time...');
        await loadAndPlayMusic();
        return;
      }

      const status = await sound.getStatusAsync();
      
      if (!status.isLoaded) {
        console.log('⚠️ Sound not loaded, reloading...');
        // Sound was unloaded, need to reload
        setSound(null);
        await loadAndPlayMusic();
        return;
      }

      console.log('🎵 Current music status:', { isLoaded: true, isPlaying: status.isPlaying });
      
      if (status.isPlaying) {
        console.log('⏸️ Pausing music...');
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        console.log('▶️ Playing music...');
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('❌ Error toggling music:', error);
      // Reset state on error
      setSound(null);
      setIsPlaying(false);
    }
  };

  const pauseMusicPlayback = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error pausing music:', error);
      }
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);
      onImageChange?.(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item }}
        style={styles.image}
        resizeMode="cover"
      />
      {/* Image counter overlay */}
      <View style={styles.imageCounter}>
        <Ionicons name="images-outline" size={14} color="#fff" />
        <View style={styles.counterText}>
          <View style={styles.counterBadge}>
            <Ionicons name="ellipse" size={8} color="#fff" />
          </View>
        </View>
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {images.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `image-${index}`}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
      />

      {/* Pagination dots */}
      {images.length > 1 && renderPaginationDots()}

      {/* Music control button with title */}
      {musicUrl && (
        <TouchableOpacity
          style={styles.musicButton}
          onPress={toggleMusic}
          disabled={isMusicLoading}
        >
          <View style={styles.musicButtonInner}>
            {isMusicLoading ? (
              <Ionicons name="hourglass-outline" size={20} color="#fff" />
            ) : (
              <Ionicons
                name={isPlaying ? 'volume-high' : 'volume-mute'}
                size={20}
                color="#fff"
              />
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Music title display - always show if music exists, regardless of play state */}
      {musicUrl && musicTitle && (
        <View style={styles.musicTitleContainer}>
          <Ionicons name="musical-notes" size={14} color="#fff" />
          <Text style={styles.musicTitleText} numberOfLines={1}>
            {musicTitle}
          </Text>
        </View>
      )}

      {/* Cover badge for first image */}
      {currentIndex === 0 && (
        <View style={styles.coverBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <View style={styles.coverBadgeText}>
            <Ionicons name="ellipse" size={6} color="#FFD700" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH, // Square aspect ratio like Instagram
    backgroundColor: '#000',
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    top: 12,
    left: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  counterText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBadge: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  musicButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  musicButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  coverBadgeText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicTitleContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  musicTitleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
