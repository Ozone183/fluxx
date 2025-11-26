import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { FEATURED_MOVIES, FeaturedMovie } from '../data/featuredMovies';

interface VideoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVideo: (videoUrl: string, videoTitle: string) => void;
}

const VideoPickerModal: React.FC<VideoPickerModalProps> = ({
  visible,
  onClose,
  onSelectVideo,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // DEBUG
  console.log('📹 VideoPickerModal visible:', visible);

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        onSelectVideo(video.uri, videoTitle || 'My Video');
        onClose();
      }
    } catch (error) {
      console.error('Pick video error:', error);
      Alert.alert('Error', 'Could not pick video');
    }
  };

  const handleUrlSubmit = () => {
    if (!videoUrl.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }

    let url = videoUrl.trim();

    // 🔧 FIX: Add https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Check if YouTube link
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    // Check if Tubi link
    const isTubi = url.includes('tubitv.com');

    if (isYouTube) {
      onSelectVideo(url, videoTitle.trim() || 'YouTube Video');
      onClose();
      setVideoUrl('');
      setVideoTitle('');
      return;
    }

    if (isTubi) {
      onSelectVideo(url, videoTitle.trim() || 'Tubi Movie');
      onClose();
      setVideoUrl('');
      setVideoTitle('');
      return;
    }

    // Check if Archive.org link
    const isArchive = url.includes('archive.org');

    if (isArchive) {
      // Archive.org URLs work directly!
      onSelectVideo(url, videoTitle.trim() || 'Archive.org Video');
      onClose();
      setVideoUrl('');
      setVideoTitle('');
      return;
    }

    // Check if Vimeo link
    const isVimeo = url.includes('vimeo.com');
    
    if (isVimeo) {
      // Convert to embed URL if needed
      let vimeoUrl = url;
      const vimeoIdMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoIdMatch && !url.includes('player.vimeo.com')) {
        vimeoUrl = `https://player.vimeo.com/video/${vimeoIdMatch[1]}`;
      }
      
      onSelectVideo(vimeoUrl, videoTitle.trim() || 'Vimeo Video');
      onClose();
      setVideoUrl('');
      setVideoTitle('');
      return;
    }

    if (false) { // OLD YOUTUBE BLOCK - DISABLED
      onSelectVideo(url, videoTitle.trim() || 'YouTube Video');
      onClose();
      setVideoUrl('');
      setVideoTitle('');
      return;
    }

    // Check if it's a direct video file OR special platform
    const isDirectVideo = url.endsWith('.mp4') || 
                          url.endsWith('.m3u8') || 
                          url.endsWith('.mov') ||
                          url.endsWith('.avi') ||
                          url.includes('player.vimeo.com') ||
                          url.includes('commondatastorage.googleapis.com');

    if (!isDirectVideo) {
      Alert.alert(
        'Invalid Video URL',
        'Supported formats:\n\n• Vimeo videos\n• Archive.org videos\n• YouTube links\n• Direct video files (.mp4, .m3u8, .mov, .avi)',
        [{ text: 'OK' }]
      );
      return;
    }

    onSelectVideo(url, videoTitle.trim() || 'Video');
    onClose();
    setVideoUrl('');
    setVideoTitle('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Choose Video 🎬</Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={28} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Featured Movies Section */}
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>🎬 Featured Movies</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.moviesScroll}
            >
              {FEATURED_MOVIES.map((movie) => (
                <TouchableOpacity
                  key={movie.id}
                  style={styles.movieCard}
                  onPress={() => {
                    onSelectVideo(movie.videoUrl, movie.title);
                    onClose();
                  }}
                >
                  <View style={styles.movieThumbnail}>
                    <Icon name="film" size={40} color={COLORS.cyan400} />
                  </View>
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {movie.title}
                  </Text>
                  <Text style={styles.movieMeta}>
                    {movie.year} • {movie.duration}
                  </Text>
                  <View style={styles.genreBadge}>
                    <Text style={styles.genreText}>{movie.genre}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

            {/* Pick from Gallery */}
            <TouchableOpacity
              style={styles.optionButton}
              onPress={pickFromGallery}
              disabled={loading}
            >
              <Icon name="film" size={24} color={COLORS.cyan400} />
              <Text style={styles.optionText}>Pick from Gallery</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Video URL Input */}
            <Text style={styles.label}>Video URL</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste YouTube, Archive.org, or .mp4 URL"
              placeholderTextColor={COLORS.slate500}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* Video Title Input */}
            <Text style={styles.label}>Video Title (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="My Favorite Movie"
              placeholderTextColor={COLORS.slate500}
              value={videoTitle}
              onChangeText={setVideoTitle}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, !videoUrl.trim() && styles.submitButtonDisabled]}
              onPress={handleUrlSubmit}
              disabled={!videoUrl.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={24} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Use This Video</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.slate800,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.slate700,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate500,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.slate800,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.cyan500,
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.slate700,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  featuredSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
  },
  moviesScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  movieCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  movieThumbnail: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.slate900,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
    height: 32,
  },
  movieMeta: {
    fontSize: 11,
    color: COLORS.slate400,
    marginBottom: 6,
  },
  genreBadge: {
    backgroundColor: COLORS.cyan500,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  genreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default VideoPickerModal;
