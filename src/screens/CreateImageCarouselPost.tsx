import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { awardTokens } from '../utils/tokens';
import TokenToast from '../components/TokenToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - 32;

// Predefined music library
const MUSIC_LIBRARY = [
    { id: 'none', name: 'No Music', url: null },
    { id: 'chill', name: 'Chill Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'upbeat', name: 'Upbeat Energy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'lofi', name: 'Lo-Fi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'jazz', name: 'Smooth Jazz', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ];

export default function CreateImageCarouselPostScreen() {
  const navigation = useNavigation();
  const { userId, userChannel, userProfilePic } = useAuth();

  const [images, setImages] = useState<string[]>([]);
  const [selectedMusic, setSelectedMusic] = useState(MUSIC_LIBRARY[0]);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTokenToast, setShowTokenToast] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access to select images.');
      return false;
    }
    return true;
  };

  // Pick multiple images
  const handlePickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 10)); // Max 10 images
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Post carousel
  const handlePost = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please add at least one image to your post.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsUploading(true);
    setUploadProgress(0);

    try {
        console.log('🚀 Starting carousel post creation...');
        console.log('📷 Images to upload:', images.length);
        console.log('🎵 Selected music:', selectedMusic.name);
        console.log('👤 User info - ID:', userId, 'Channel:', userChannel);
        
        setUploadProgress(10);
  
        // Step 1: Upload images to Firebase Storage
        console.log('⬆️ Uploading images to Storage...');
        const { uploadCarouselImages } = await import('../services/carouselStorage');
        const uploadResult = await uploadCarouselImages(images, userId);
        
        console.log('✅ Upload complete!');
        console.log('   - Successful uploads:', uploadResult.imageUrls.length);
        console.log('   - Errors:', uploadResult.errors.length);
        console.log('   - Image URLs:', uploadResult.imageUrls);
        
        if (uploadResult.errors.length > 0) {
          console.error('⚠️ Some images failed:', uploadResult.errors);
        }
        
        if (uploadResult.imageUrls.length === 0) {
          throw new Error('All image uploads failed. Please try again.');
        }
        
        setUploadProgress(60);
  
        // Step 2: Create post in Firestore
        console.log('📝 Creating post document in Firestore...');
        const { createCarouselPost } = await import('../services/carouselPostService');
        const postId = await createCarouselPost(
          userId,                      // userId
          userChannel || 'Unknown',    // username (using channel as fallback)
          uploadResult.imageUrls,      // images array (extracted from result)
          selectedMusic.url,           // musicUrl (can be null)
          selectedMusic.name,          // musicTitle
          caption.trim(),              // caption
          userProfilePic || undefined  // userAvatar
        );
        console.log('✅ Post created with ID:', postId);
        setUploadProgress(90);
  
        // Step 3: Award tokens
        console.log('🪙 Awarding tokens...');
        if (userId) {
          await awardTokens({
            userId,
            amount: 5,
            type: 'post',
            description: 'Image carousel post created'
          });
        }
        setUploadProgress(100);
        console.log('🎉 Post creation complete!');
  
        setShowTokenToast(true);
        setTimeout(() => setShowTokenToast(false), 3000);
  
        setTimeout(() => {
          (navigation as any).navigate('MainTabs', { screen: 'Feed' });
        }, 1000);
      } catch (error) {
        console.error('❌ ERROR creating carousel post:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Failed to create your post. Please try again.');
        setIsUploading(false);
        setUploadProgress(0);
      }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (images.length > 0) {
      Alert.alert(
        'Discard Post?',
        'Are you sure you want to discard this post?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => (navigation as any).navigate('MainTabs', { screen: 'Feed' }),
          },
        ]
      );
    } else {
      (navigation as any).navigate('MainTabs', { screen: 'Feed' });
    }
  };

  // Intercept hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleCancel();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [images.length])
  );

  if (isUploading) {
    return (
      <SafeAreaView style={styles.uploadingContainer}>
        <View style={styles.uploadingContent}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.uploadingTitle}>Creating Your Post...</Text>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={styles.headerButton}
            disabled={images.length === 0}
          >
            <Text style={[styles.postButton, images.length === 0 && styles.postButtonDisabled]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Images ({images.length}/10)</Text>
            
            {images.length > 0 && (
              <FlatList
                horizontal
                data={images}
                keyExtractor={(item, index) => `${item}-${index}`}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={styles.imageCard}>
                    <Image source={{ uri: item }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close-circle" size={28} color={COLORS.red500} />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Cover</Text>
                      </View>
                    )}
                  </View>
                )}
                contentContainerStyle={styles.imagesContainer}
              />
            )}

            {images.length < 10 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickImages}
              >
                <LinearGradient
                  colors={GRADIENTS.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addImageGradient}
                >
                  <Ionicons name="images" size={32} color="#FFFFFF" />
                  <Text style={styles.addImageText}>
                    {images.length === 0 ? 'Add Images' : 'Add More'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Music Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Background Music</Text>
            
            <TouchableOpacity
              style={styles.musicSelector}
              onPress={() => setShowMusicPicker(!showMusicPicker)}
            >
              <View style={styles.musicSelectorContent}>
                <Ionicons name="musical-notes" size={24} color={COLORS.cyan400} />
                <View style={styles.musicInfo}>
                  <Text style={styles.musicName}>{selectedMusic.name}</Text>
                  <Text style={styles.musicSubtext}>
                    {selectedMusic.id === 'none' ? 'No music selected' : 'Tap to change'}
                  </Text>
                </View>
                <Ionicons 
                  name={showMusicPicker ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={COLORS.slate400} 
                />
              </View>
            </TouchableOpacity>

            {showMusicPicker && (
              <View style={styles.musicPicker}>
                {MUSIC_LIBRARY.map((music) => (
                  <TouchableOpacity
                    key={music.id}
                    style={[
                      styles.musicOption,
                      selectedMusic.id === music.id && styles.musicOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedMusic(music);
                      setShowMusicPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons 
                      name={selectedMusic.id === music.id ? "checkmark-circle" : "musical-note"} 
                      size={20} 
                      color={selectedMusic.id === music.id ? COLORS.cyan400 : COLORS.slate400} 
                    />
                    <Text style={[
                      styles.musicOptionText,
                      selectedMusic.id === music.id && styles.musicOptionTextSelected
                    ]}>
                      {music.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Caption Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Caption</Text>
            <View style={styles.captionInputContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption..."
                placeholderTextColor={COLORS.slate400}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
              />
              <Text style={styles.characterCount}>{caption.length}/500</Text>
            </View>
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.cyan400} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Pro Tips</Text>
              <Text style={styles.tipsText}>
                • Add up to 10 images per post{'\n'}
                • First image is the cover{'\n'}
                • Music plays while viewing{'\n'}
                • Swipe to see all images
              </Text>
            </View>
          </View>
        </ScrollView>

        {showTokenToast && (
          <TokenToast
            visible={showTokenToast}
            amount={5}
            message="Post created!"
            onHide={() => setShowTokenToast(false)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  headerButton: {
    width: 60,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  postButtonDisabled: {
    color: COLORS.slate600,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  imagesContainer: {
    paddingBottom: 16,
  },
  imageCard: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.slate800,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.cyan400,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  addImageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  addImageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  musicSelector: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    padding: 16,
  },
  musicSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicInfo: {
    flex: 1,
    marginLeft: 12,
  },
  musicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  musicSubtext: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 2,
  },
  musicPicker: {
    marginTop: 12,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    overflow: 'hidden',
  },
  musicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  musicOptionSelected: {
    backgroundColor: `${COLORS.cyan400}15`,
  },
  musicOptionText: {
    fontSize: 16,
    color: COLORS.slate300,
    marginLeft: 12,
  },
  musicOptionTextSelected: {
    color: COLORS.cyan400,
    fontWeight: '600',
  },
  captionInputContainer: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'right',
    marginTop: 8,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.cyan400 + '30',
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.slate300,
    lineHeight: 20,
  },
  uploadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  uploadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  uploadingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 32,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.slate800,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
});
