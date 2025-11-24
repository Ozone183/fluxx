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
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { uploadVideo, generateThumbnail, getVideoSize } from '../services/videoStorage';
import { createVideoPost } from '../services/postsApi-video';
import { awardTokens } from '../utils/tokens';
import TokenToast from '../components/TokenToast';
import VideoPicker from '../components/VideoPicker';

const LARGE_VIDEO_THRESHOLD = 30; // MB - show thumbnail instead of video preview

export default function CreateVideoPostScreen() {
  const navigation = useNavigation();
  const { userId, userChannel, userProfilePic } = useAuth();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoSize, setVideoSize] = useState<number>(0); // ✅ Track video size
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null); // ✅ Store thumbnail
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTokenToast, setShowTokenToast] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false); // ✅ For thumbnail generation

  const videoRef = useRef<Video>(null);

  const handleVideoSelected = async (uri: string, duration: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setIsProcessingVideo(true);
    
    try {
      // ✅ Get video size WITHOUT loading into memory
      const sizeMB = await getVideoSize(uri);
      console.log(`📹 Video selected: ${sizeMB.toFixed(1)}MB, ${duration}s`);
      
      setVideoUri(uri);
      setVideoDuration(duration);
      setVideoSize(sizeMB);
      
      // ✅ Generate thumbnail (handles failures gracefully)
      const thumb = await generateThumbnail(uri);
      setThumbnailUri(thumb);
      
      if (!thumb) {
        console.warn('⚠️ Thumbnail generation failed, will show video info only');
      }
      
    } catch (error) {
      console.error('Error processing video:', error);
      Alert.alert('Warning', 'Could not process video preview, but you can still upload.');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // ✅ Unload video from memory when removing
    try {
      if (videoRef.current) {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
        console.log('🧹 Video unloaded from memory');
      }
    } catch (error) {
      console.warn('⚠️ Video unload failed:', error);
    }
    
    setVideoUri(null);
    setVideoDuration(0);
    setVideoSize(0);
    setThumbnailUri(null);
  };

  const handlePost = async () => {
    if (!videoUri || !userId) {
      Alert.alert('Error', 'Please select a video and make sure you are logged in.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('🚀 Starting video post upload...');
      
      // ✅ Upload video and thumbnail (handles null thumbnail gracefully)
      const { videoUrl, thumbnailUrl } = await uploadVideo(
        videoUri,
        thumbnailUri, // Can be null if generation failed
        userId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      console.log('✅ Upload complete, creating post...');

      // Create post in Firestore
      await createVideoPost({
        userId: userId,
        username: userChannel || 'Anonymous',
        userAvatar: userProfilePic || '',
        caption: caption.trim(),
        videoUrl,
        thumbnailUrl,
        duration: videoDuration,
        isProcessing: true, // Server will compress and update
      });

      console.log('✅ Post created in Firestore');

      // Award tokens for creating post
      if (userId) {
        await awardTokens({
          userId,
          amount: 8,
          type: 'post',
          description: 'Video post created'
        });
      }

      // ✅ CRITICAL: Unload video from memory BEFORE navigation
      console.log('🧹 Unloading video from memory...');
      try {
        if (videoRef.current) {
          await videoRef.current.stopAsync();
          await videoRef.current.unloadAsync();
          console.log('✅ Video unloaded successfully - memory freed!');
        }
      } catch (unloadError) {
        console.warn('⚠️ Video unload failed (non-critical):', unloadError);
      }
      
      // Show token toast
      setShowTokenToast(true);
      setTimeout(() => setShowTokenToast(false), 3000);

      // Navigate back to feed
      setTimeout(() => {
        (navigation as any).navigate('MainTabs', { screen: 'Feed' });
      }, 1000);
    } catch (error) {
      console.error('❌ Error posting video:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to post your video. Please check your internet connection and try again.'
      );
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (videoUri) {
      Alert.alert(
        'Discard Video?',
        'Are you sure you want to discard this video?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              // ✅ Unload video before discarding
              try {
                if (videoRef.current) {
                  await videoRef.current.stopAsync();
                  await videoRef.current.unloadAsync();
                  console.log('🧹 Video unloaded on cancel');
                }
              } catch (error) {
                console.warn('⚠️ Video unload failed:', error);
              }
              (navigation as any).navigate('MainTabs', { screen: 'Feed' });
            },
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
    }, [videoUri])
  );

  // ✅ Cleanup video when leaving screen (screen blur/unmount)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup: stop and unload video when leaving screen
        if (videoRef.current) {
          videoRef.current.stopAsync().catch(() => {});
          videoRef.current.unloadAsync().catch(() => {});
          console.log('🧹 Video unloaded on screen blur');
        }
      };
    }, [])
  );

  if (isUploading) {
    return (
      <SafeAreaView style={styles.uploadingContainer}>
        <View style={styles.uploadingContent}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.uploadingTitle}>Uploading Your Video...</Text>
          <Text style={styles.uploadingSubtitle}>
            This may take a few moments
          </Text>
          
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

          <Text style={styles.uploadingNote}>
            Please don't close the app while uploading
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!videoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Video Post</Text>
          <View style={styles.headerButton} />
        </View>

        <VideoPicker onVideoSelected={handleVideoSelected} />

        {showTokenToast && (
          <TokenToast
            visible={showTokenToast}
            amount={8}
            message="Video posted!"
            onHide={() => setShowTokenToast(false)}
          />
        )}
      </SafeAreaView>
    );
  }

  // ✅ Show loading while processing video
  if (isProcessingVideo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Video Post</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.cyan400} />
          <Text style={styles.processingText}>Processing video...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ SMART PREVIEW: Show thumbnail for large videos, video player for small videos
  const shouldShowThumbnail = videoSize > LARGE_VIDEO_THRESHOLD;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Video Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            style={styles.headerButton}
          >
            <Text style={styles.postButton}>
              Post
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.videoContainer}>
            {/* ✅ CONDITIONAL RENDERING: Thumbnail for large videos, Video player for small */}
            {shouldShowThumbnail ? (
              // Large video: Show thumbnail preview only
              <View style={styles.thumbnailPreviewContainer}>
                {thumbnailUri ? (
                  <Image
                  source={{ uri: thumbnailUri }}
                  style={styles.thumbnailPreview as any}
                  resizeMode="cover"
                />
                ) : (
                  <View style={styles.noThumbnailContainer}>
                    <Ionicons name="videocam" size={64} color={COLORS.slate600} />
                    <Text style={styles.noThumbnailText}>Video Preview</Text>
                  </View>
                )}
                
                {/* Overlay badge showing it's a large video */}
                <View style={styles.largeBadge}>
                  <Ionicons name="film" size={16} color="#FFFFFF" />
                  <Text style={styles.largeBadgeText}>
                    Large Video - Preview disabled
                  </Text>
                </View>
              </View>
            ) : (
              // Small video: Show full video player
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.videoPreview}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            )}
            
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={handleRemoveVideo}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GRADIENTS.danger}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.removeVideoGradient}
              >
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.removeVideoText}>Remove Video</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.videoDurationBadge}>
              <Ionicons name="time-outline" size={16} color="#FFFFFF" />
              <Text style={styles.videoDurationText}>
                {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            {/* ✅ Show file size badge */}
            <View style={styles.videoSizeBadge}>
              <Ionicons name="document-outline" size={16} color="#FFFFFF" />
              <Text style={styles.videoSizeText}>
                {videoSize.toFixed(1)} MB
              </Text>
            </View>
          </View>

          {/* ✅ Info card for large videos */}
          {shouldShowThumbnail && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={COLORS.cyan400} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Large Video Detected</Text>
                <Text style={styles.infoText}>
                  Preview disabled to prevent crashes. Your video will be compressed automatically after posting.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.captionSection}>
            <Text style={styles.sectionLabel}>Caption</Text>
            <View style={styles.captionInputContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="What's happening in your video?"
                placeholderTextColor={COLORS.slate400}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
                autoFocus={false}
              />
              <Text style={styles.characterCount}>{caption.length}/500</Text>
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.cyan400} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Tips for Great Video Posts</Text>
              <Text style={styles.tipsText}>
                • Keep it engaging and authentic{'\n'}
                • Add a descriptive caption{'\n'}
                • Large videos are compressed automatically{'\n'}
                • Vertical videos work best
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handlePost}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postButtonGradient}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
              <Text style={styles.postButtonText}>Post Video</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {showTokenToast && (
          <TokenToast
            visible={showTokenToast}
            amount={8}
            message="Video posted!"
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
    width: 44,
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
  content: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.slate300,
  },
  videoContainer: {
    position: 'relative',
    marginTop: 16,
    marginHorizontal: 16,
  },
  videoPreview: {
    width: '100%',
    height: 400,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  thumbnailPreviewContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
  },
  noThumbnailContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
  },
  noThumbnailText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.slate400,
  },
  largeBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -20 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    width: 200,
    justifyContent: 'center',
  },
  largeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeVideoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  removeVideoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  videoDurationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  videoSizeBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  videoSizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.cyan400 + '30',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.slate300,
    lineHeight: 20,
  },
  captionSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
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
  bottomBar: {
    padding: 16,
    paddingBottom: 60,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
    backgroundColor: COLORS.slate900,
  },
  postButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginBottom: 8,
  },
  uploadingSubtitle: {
    fontSize: 16,
    color: COLORS.slate400,
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
  uploadingNote: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 24,
  },
});