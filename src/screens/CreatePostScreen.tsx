import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import TokenToast from '../components/TokenToast';

const GEMINI_API_KEY = 'AIzaSyCg_HIe7ajHyWtCXMhx9YwOVHWX_qHBjBQ';

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { userId, userChannel } = useAuth();

  // Intercept hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        (navigation as any).navigate('MainTabs', { screen: 'Feed' });
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showCritique, setShowCritique] = useState(false);
  const [critique, setCritique] = useState('');
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showTokenToast, setShowTokenToast] = useState(false);
  const [tokenToastData, setTokenToastData] = useState({ amount: 0, message: '' });

  // Caption options state
  const [captionOptions, setCaptionOptions] = useState<string[]>([]);
  const [showCaptionOptions, setShowCaptionOptions] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Removed forced crop
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removeImage = () => {
    setImageUri(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const generateAICaption = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Add an image first!');
      return;
    }

    setIsGeneratingCaption(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();

      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Image = await base64Promise;

      const systemPrompt = 'You are a creative social media caption writer. Analyze the image and generate 3 diverse, engaging caption options that match the actual content. Make them varied: one witty, one inspirational, one casual. Keep each short (max 2 sentences). Use relevant emojis. Format EXACTLY as:\n\n1) [caption text here]\n2) [caption text here]\n3) [caption text here]';

      const payload = {
        contents: [{
          parts: [
            { text: 'Analyze this image and generate 3 creative caption options based on what you see.' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const apiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        payload,
      );

      const rawCaptions = apiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse captions into array
      const captionsArray = rawCaptions
        .split('\n')
        .filter((line: string) => line.match(/^\d+\)/))
        .map((line: string) => line.replace(/^\d+\)\s*/, '').trim());

      if (captionsArray.length > 0) {
        setCaptionOptions(captionsArray);
        setShowCaptionOptions(true);
        Alert.alert('AI Captions Ready! ', 'Tap to select your favorite caption below!');
      } else {
        Alert.alert('Error', 'Failed to generate captions properly');
      }
    } catch (error) {
      console.error('Caption error:', error);
      Alert.alert('Error', 'Failed to generate captions. The AI might be overloaded.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const selectCaption = (caption: string) => {
    setContent(caption);
    setShowCaptionOptions(false);
    setCaptionOptions([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const generateCritique = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Post', 'Write something first!');
      return;
    }

    setIsCritiquing(true);
    setShowCritique(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const systemPrompt =
        'You are a professional social media strategist. Analyze the user\'s post content for clarity, tone, and engagement. Provide a critique formatted as three concise, distinct points: 1) Current Vibe/Tone, 2) Suggestion for Improvement, and 3) Potential Risk.';

      const payload = {
        contents: [{ parts: [{ text: `Critique: "${content}"` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        payload,
      );

      const text =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Critique generation failed.';
      setCritique(text.trim());
    } catch (error) {
      console.error('Critique error:', error);
      setCritique('Failed to generate critique. Check API key.');
    } finally {
      setIsCritiquing(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Post', 'Write something to share!');
      return;
    }

    if (!userId || !userChannel) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsPosting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let imageUrl = null;

      // Upload image to Firebase Storage if present
      if (imageUri) {
        try {
          // Convert image URI to blob
          const response = await fetch(imageUri);
          const blob = await response.blob();

          // Create unique filename
          const filename = `posts/${userId}_${Date.now()}.jpg`;
          const storageRef = ref(storage, filename);

          // Upload image
          await uploadBytes(storageRef, blob);

          // Get download URL
          imageUrl = await getDownloadURL(storageRef);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Warning', 'Failed to upload image, posting without it');
        }
      }

      // Create post with image URL
      const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');

      await addDoc(postsRef, {
        userId,
        userChannel,
        content: content.trim(),
        image: imageUrl,
        timestamp: serverTimestamp(),
        likedBy: [],
        commentsCount: 0,
      });

      // AWARD TOKENS FOR POST CREATION
      try {
        const { awardTokens } = await import('../utils/tokens');
        await awardTokens({
          userId,
          amount: 8,
          type: 'post',
          description: 'Created a new post',
        });
        console.log('🪙 Awarded 8 tokens for post creation');

        // Show toast notification
        setTokenToastData({ amount: 8, message: 'Post created!' });
        setShowTokenToast(true);
      } catch (tokenError) {
        console.error('Token award error:', tokenError);
      }

      setContent('');
      setImageUri(null);
      setCritique('');
      setShowCritique(false);
      setCaptionOptions([]);
      setShowCaptionOptions(false);

      Alert.alert('Success!', 'Your flux has been posted! ', [
        { text: 'OK', onPress: () => (navigation as any).navigate('MainTabs', { screen: 'Feed' }) },
      ]);
    } catch (error: any) {
      console.error('Post error:', error);
      Alert.alert('Error', `Failed to post: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.slate900, COLORS.slate800]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button */}
          <View style={styles.headerWithBack}>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Feed' })}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Flux</Text>
            <Text style={styles.subtitle}>Share your moment as {userChannel}</Text>
          </View>

          {/* Content Input */}
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={text => {
              setContent(text);
              if (showCritique) setShowCritique(false);
            }}
            placeholder="What's on your mind?"
            placeholderTextColor={COLORS.slate500}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />

          <Text style={styles.charCount}>{content.length}/1000</Text>

          {/* Caption Options (Selectable) */}
          {showCaptionOptions && captionOptions.length > 0 && (
            <View style={styles.captionOptionsContainer}>
              <Text style={styles.captionOptionsTitle}> Select Your Caption:</Text>
              {captionOptions.map((caption, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.captionOption}
                  onPress={() => selectCaption(caption)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[COLORS.slate700, COLORS.slate800] as const}
                    style={styles.captionOptionGradient}
                  >
                    <Text style={styles.captionOptionNumber}>{index + 1}</Text>
                    <Text style={styles.captionOptionText}>{caption}</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.cyan400} />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.cancelCaptionsButton}
                onPress={() => {
                  setShowCaptionOptions(false);
                  setCaptionOptions([]);
                }}
              >
                <Text style={styles.cancelCaptionsText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* Image Picker Button */}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={20} color={COLORS.cyan400} />
            <Text style={styles.imageButtonText}>
              {imageUri ? 'Change Image' : 'Add Image'}
            </Text>
          </TouchableOpacity>

          {/* AI Caption Button (only shows when image is added) */}
          {imageUri && !showCaptionOptions && (
            <TouchableOpacity
              style={styles.captionButton}
              onPress={generateAICaption}
              disabled={isGeneratingCaption}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={GRADIENTS.success}
                style={styles.captionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name={isGeneratingCaption ? 'reload-outline' : 'star-outline'}
                  size={18}
                  color={COLORS.white}
                />
                <Text style={styles.captionButtonText}>
                  {isGeneratingCaption ? 'Generating...' : 'AI Caption '}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* AI Critique Section */}
          <TouchableOpacity
            style={styles.critiqueButton}
            onPress={generateCritique}
            disabled={isCritiquing || !content.trim()}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={GRADIENTS.accent}
              style={styles.critiqueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name={isCritiquing ? 'reload-outline' : 'flash-outline'}
                size={18}
                color={COLORS.white}
              />
              <Text style={styles.critiqueButtonText}>
                {isCritiquing ? 'Analyzing...' : 'AI Strategy Critique'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {showCritique && (
            <View style={styles.critiquePanel}>
              <Text style={styles.critiqueTitle}> AI Feedback:</Text>
              {isCritiquing ? (
                <ActivityIndicator color={COLORS.cyan400} />
              ) : (
                <Text style={styles.critiqueText}>{critique}</Text>
              )}
            </View>
          )}

          {/* Post Button */}
          <TouchableOpacity
            style={[styles.postButton, (!content.trim() || isPosting) && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!content.trim() || isPosting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={content.trim() && !isPosting ? GRADIENTS.primary : [COLORS.slate700, COLORS.slate700] as const}
              style={styles.postGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isPosting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={COLORS.white} />
                  <Text style={styles.postButtonText}>Post to Fluxx</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Token Toast */}
      <TokenToast
        visible={showTokenToast}
        amount={tokenToastData.amount}
        message={tokenToastData.message}
        onHide={() => setShowTokenToast(false)}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120, // Extra padding for keyboard
  },
  headerWithBack: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate400,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.white,
    minHeight: 160,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'right',
    marginBottom: 16,
  },
  captionOptionsContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  captionOptionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cyan400,
    marginBottom: 12,
  },
  captionOption: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  captionOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  captionOptionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cyan400,
    marginRight: 12,
    width: 24,
  },
  captionOptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.white,
    lineHeight: 22,
  },
  cancelCaptionsButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelCaptionsText: {
    fontSize: 14,
    color: COLORS.slate400,
    fontWeight: '600',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: COLORS.slate700,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.red500,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.slate800,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    marginBottom: 16,
  },
  imageButtonText: {
    color: COLORS.cyan400,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  captionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  captionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  captionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  critiqueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  critiqueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  critiqueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  critiquePanel: {
    backgroundColor: COLORS.slate800,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.indigo600,
  },
  critiqueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cyan400,
    marginBottom: 12,
  },
  critiqueText: {
    fontSize: 14,
    color: COLORS.gray200,
    lineHeight: 22,
  },
  postButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 40,
  },
  postButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  postGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  postButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 1,
  },
  quickCreateContainer: {
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  quickCreateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
    marginBottom: 12,
  },
  quickCreateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCreateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  quickCreateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  quickCreateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreatePostScreen;