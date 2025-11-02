import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

const GEMINI_API_KEY = 'AIzaSyCg_HIe7ajHyWtCXMhx9YwOVHWX_qHBjBQ';

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { userId, userChannel } = useAuth();

  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showCritique, setShowCritique] = useState(false);
  const [critique, setCritique] = useState('');
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
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
      const systemPrompt = 'You are a creative social media caption writer. Generate 3 catchy, engaging caption options for a social media post. Keep them short (max 2 sentences each), fun, and Instagram-worthy. Use emojis where appropriate. Format as: \n\n1) [caption]\n2) [caption]\n3) [caption]';

      const payload = {
        contents: [{ parts: [{ text: 'Generate 3 creative caption options for a social media post with an image' }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        payload,
      );

      const captions = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate captions';
      setContent(captions);
      Alert.alert('AI Captions Generated! ✨', 'Pick one and edit as you like!');
    } catch (error) {
      console.error('Caption error:', error);
      Alert.alert('Error', 'Failed to generate captions');
    } finally {
      setIsGeneratingCaption(false);
    }
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
      const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');

      await addDoc(postsRef, {
        userId,
        userChannel,
        content: content.trim(),
        image: imageUri || null,
        timestamp: serverTimestamp(),
        likedBy: [],
        commentsCount: 0,
      });

      setContent('');
      setImageUri(null);
      setCritique('');
      setShowCritique(false);

      Alert.alert('Success!', 'Your flux has been posted! 🎉', [
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
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
          {imageUri && (
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
                  {isGeneratingCaption ? 'Generating...' : 'AI Caption ✨'}
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
              <Text style={styles.critiqueTitle}>📊 AI Feedback:</Text>
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
              colors={content.trim() && !isPosting ? GRADIENTS.primary : [COLORS.slate700, COLORS.slate700]}
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
});

export default CreatePostScreen;
