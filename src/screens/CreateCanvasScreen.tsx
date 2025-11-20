// src/screens/CreateCanvasScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BackHandler } from 'react-native';

import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { Canvas, CanvasLayer } from '../types/canvas';
import { CANVAS_TEMPLATES } from '../data/canvasTemplates';

const CreateCanvasScreen = () => {
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

  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(CANVAS_TEMPLATES[0]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please give your canvas a title');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create a canvas');
      return;
    }

    try {
      setCreating(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const now = Date.now();
      const expiresAt = now + (24 * 60 * 60 * 1000);

      // Create starter layers for template
      let starterLayers: CanvasLayer[] = [];


      const canvasData: Omit<Canvas, 'id'> = {
        title: title.trim(),
        creatorId: userId,
        creatorUsername: userChannel || '@unknown',

        width: 1080,
        height: 1920,
        backgroundColor: selectedTemplate.backgroundColor,
        templateId: selectedTemplate.id, // ✅ ADD THIS LINE

        accessType: isPrivate ? 'private' : 'public',
        ...(isPrivate && {
          inviteCode: generateInviteCode(),
          allowedUsers: [userId], // Creator has access by default
          pendingRequests: [],
        }),

        layers: starterLayers,
        totalPages: selectedTemplate.totalPages, // ← ADD THIS LINE

        collaborators: {
          [userId]: {
            userId: userId,
            username: userChannel || '@unknown',
            profilePicUrl: null,
            joinedAt: now,
            isActive: true,
            lastSeen: now,
          }
        },
        maxCollaborators: selectedTemplate.maxLayers,

        createdAt: now,
        expiresAt,
        isExpired: false,
        isArchived: false,

        viewCount: 0,
        likeCount: 0,
        likedBy: [],
        commentCount: 0,
        reactions: {
          heart: [],
          fire: [],
          laugh: [],
          clap: [],
          heart_eyes: [],
          sparkles: [],
        },
        reactionCounts: {
          heart: 0,
          fire: 0,
          laugh: 0,
          clap: 0,
          heart_eyes: 0,
          sparkles: 0,
        },
      };

      const canvasRef = await addDoc(
        collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'canvases'),
        canvasData
      );

      // Update canvas count AND award tokens
      try {
        const profileRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId);
        await updateDoc(profileRef, {
          canvasesCreated: increment(1)
        });
        console.log('✅ Canvas count incremented');

        // AWARD TOKENS FOR CANVAS CREATION
        const { awardTokens } = await import('../utils/tokens');
        await awardTokens({
          userId,
          amount: 15,
          type: 'post',
          description: 'Created a new canvas',
          relatedId: canvasRef.id,
        });
        console.log('🪙 Awarded 15 tokens for canvas creation');
      } catch (error) {
        console.error('⚠️ Canvas count/token update failed:', error);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      (navigation as any).navigate('CanvasEditor', { canvasId: canvasRef.id });

    } catch (error) {
      console.error('Canvas creation error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Creation Failed', 'Could not create canvas. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Feed' })} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Canvas</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.previewCard}>
          <Icon name="color-palette" size={60} color={COLORS.white} />
          <Text style={styles.previewText}>Canvas Collab</Text>
          <Text style={styles.previewSubtext}>Create & collaborate in real-time</Text>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Canvas Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Weekend Vibes, Team Brainstorm..."
              placeholderTextColor={COLORS.slate500}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
              autoFocus
            />
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Choose Template</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CANVAS_TEMPLATES.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === template.id && styles.templateCardSelected
                  ]}
                  onPress={() => setSelectedTemplate(template)}
                >
                  <Icon name={template.icon as any} size={24} color={COLORS.cyan400} />
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateDesc}>{template.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Icon
                  name={isPrivate ? 'lock-closed' : 'earth'}
                  size={20}
                  color={isPrivate ? COLORS.amber400 : COLORS.cyan400}
                />
                <Text style={styles.label}>
                  {isPrivate ? 'Private Canvas' : 'Public Canvas'}
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: COLORS.slate700, true: COLORS.cyan500 }}
                thumbColor={COLORS.white}
              />
            </View>
            <Text style={styles.hint}>
              {isPrivate
                ? 'Only people with invite code can join'
                : 'Anyone can discover and join this canvas'}
            </Text>
          </View>

          {selectedTemplate.suggestedPrompts.length > 0 && (
            <View style={styles.promptsPreview}>
              <Text style={styles.promptsTitle}>This template includes:</Text>
              {selectedTemplate.suggestedPrompts.map((prompt, i) => (
                <Text key={i} style={styles.promptItem}>• {prompt}</Text>
              ))}
            </View>
          )}

          {/* ADD THIS ENTIRE BLOCK RIGHT HERE */}
          <View style={styles.features}>
            <Text style={styles.featuresTitle}>What you can do:</Text>
            <FeatureItem icon="image" text="Add photos & images" />
            <FeatureItem icon="text" text="Add text & captions" />
            <FeatureItem icon="people" text="Collaborate with up to 12 people" />
            <FeatureItem icon="layers" text={`Max ${selectedTemplate.maxLayers} layers per canvas`} />
            <FeatureItem icon="time" text="Canvas expires in 24 hours" />
            <FeatureItem icon="download" text="Export as image anytime" />
          </View>

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={creating}
          activeOpacity={0.8}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.createGradient}>
            {creating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Icon name="add-circle" size={24} color={COLORS.white} />
                <Text style={styles.createButtonText}>Create Canvas</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ADD THIS HERE
const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
  <View style={styles.featureItem}>
    <Icon name={icon as any} size={18} color={COLORS.cyan400} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  previewText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 16,
  },
  previewSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
    marginLeft: 8,
  },
  input: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'right',
    marginTop: 4,
    marginRight: 8,
  },
  templateCard: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    width: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: COLORS.cyan400,
    backgroundColor: COLORS.slate700,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 8,
    textAlign: 'center',
  },
  templateDesc: {
    fontSize: 10,
    color: COLORS.slate400,
    marginTop: 4,
    textAlign: 'center',
  },
  promptsPreview: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
  },
  promptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  promptItem: {
    fontSize: 13,
    color: COLORS.slate300,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontSize: 13,
    color: COLORS.slate400,
    marginTop: 8,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 80,  // ADD THIS LINE
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  features: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 120,  // ADD THIS LINE
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.slate300,
  },
});

export default CreateCanvasScreen;