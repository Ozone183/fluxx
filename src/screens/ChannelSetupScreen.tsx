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
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';

const ChannelSetupScreen = () => {
  const { userId, setUserProfile } = useAuth();
  const [channelInput, setChannelInput] = useState('');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateChannel = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    setChannelInput(sanitized);

    if (sanitized.length > 0 && sanitized.length < 3) {
      setError('Channel must be at least 3 characters');
    } else if (sanitized.length > 15) {
      setError('Channel cannot exceed 15 characters');
    } else {
      setError('');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setProfilePicUri(result.assets[0].uri);
    }
  };

  const handleSetup = async () => {
    if (!userId || channelInput.length < 3 || channelInput.length > 15) {
      return;
    }

    setIsLoading(true);
    setError('');

    const channel = `@${channelInput}`;

    try {
      // Check if channel is taken
      const profilesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles');
      const profilesSnapshot = await getDocs(profilesRef);

      const isTaken = profilesSnapshot.docs.some(
        docSnap => docSnap.data().channel === channel,
      );

      if (isTaken) {
        setError(`Channel "${channel}" is already taken`);
        setIsLoading(false);
        return;
      }

      // Create profile with all required fields
      const userProfileRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId);
      await setDoc(userProfileRef, {
        userId,
        channel,
        profilePictureUrl: profilePicUri || null,
        followers: [],
        following: [],
        followerCount: 0,
        followingCount: 0,
        canvasesCreated: 0,
        createdAt: serverTimestamp(),
      });

      setUserProfile(channel, profilePicUri);
      Alert.alert('Success!', `Welcome to Fluxx, ${channel}! 🎉`);
    } catch (err: any) {
      console.error('Channel setup error:', err);
      setError(`Setup failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = channelInput.length >= 3 && channelInput.length <= 15 && !error;

  return (
    <LinearGradient colors={[COLORS.slate900, COLORS.slate800]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>
              FLUX<Text style={styles.logoAccent}>X</Text>
            </Text>
            <Text style={styles.subtitle}>Secure Your Channel</Text>
          </View>

          {/* Profile Picture Picker */}
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {profilePicUri ? (
              <View style={styles.profilePicPreview}>
                <Image
                  source={{ uri: profilePicUri }}
                  style={styles.profilePic}
                />
                <View style={styles.editBadge}>
                  <Feather name="edit-2" size={14} color={COLORS.white} />
                </View>
              </View>
            ) : (
              <View style={styles.placeholderPic}>
                <Feather name="camera" size={32} color={COLORS.cyan400} />
                <Text style={styles.placeholderText}>Add Profile Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Channel Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Channel Name *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.input}
                value={channelInput}
                onChangeText={validateChannel}
                placeholder="yourUniqueChannel"
                placeholderTextColor={COLORS.slate500}
                maxLength={15}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.inputHint}>
              {channelInput.length}/15 characters
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
            onPress={handleSetup}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isValid ? [COLORS.cyan500, COLORS.indigo600] : [COLORS.slate700, COLORS.slate700]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitText}>Enter Fluxx</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your channel name will be visible to all Fluxx users
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 6,
  },
  logoAccent: {
    color: COLORS.cyan400,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.slate400,
    marginTop: 8,
    fontWeight: '600',
  },
  userIdContainer: {
    backgroundColor: COLORS.slate800,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  label: {
    fontSize: 12,
    color: COLORS.slate400,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userId: {
    fontSize: 14,
    color: COLORS.red400,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pickerButton: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePicPreview: {
    position: 'relative',
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.cyan400,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.cyan400,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.slate900,
  },
  placeholderPic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.slate800,
    borderWidth: 2,
    borderColor: COLORS.slate700,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.slate400,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  atSymbol: {
    fontSize: 24,
    color: COLORS.cyan400,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: COLORS.white,
    paddingVertical: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 6,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red400,
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default ChannelSetupScreen;