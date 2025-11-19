import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, query, limit as firestoreLimit, startAfter, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useNavigation, useIsFocused, useFocusEffect, useNavigationState } from '@react-navigation/native';

import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';

interface Post {
  id: string;
  userId: string;
  userChannel: string;
  content: string;
  image?: string | null;
  timestamp: any;
  likedBy: string[];
  commentsCount: number;
  reactions?: {
    heart: string[];
    fire: string[];
    laugh: string[];
    clap: string[];
    heart_eyes: string[];
    sparkles: string[];
  };
  reactionCounts?: {
    heart: number;
    fire: number;
    laugh: number;
    clap: number;
    heart_eyes: number;
    sparkles: number;
  };
}

const POSTS_PER_PAGE = 20;

const ProfileScreen = ({ route }: any) => {
  const { userId: currentUserId, userChannel, signOut, setUserProfile } = useAuth();
  const { allProfiles } = useProfiles();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const prevRouteKey = useRef(route.key);

  console.log('🔍 Profile:', {
    routeKey: route.key,
    prevKey: prevRouteKey.current,
    routeParams: route?.params?.userId,
    currentUser: currentUserId,
  });

  // Detect if this is a fresh mount (tab press) vs navigation with params
  useFocusEffect(
    React.useCallback(() => {
      // If route key changed AND we have stale params, clear them
      if (route.key !== prevRouteKey.current && route?.params?.userId) {
        console.log('🧹 New route detected, checking params');
        
        // If coming from tab (no intentional params), clear stale ones
        const timer = setTimeout(() => {
          if (route?.params?.userId) {
            console.log('🧹 Clearing stale params');
            navigation.setParams({ userId: undefined } as any);
          }
        }, 50);

        return () => clearTimeout(timer);
      }
      
      prevRouteKey.current = route.key;
    }, [route.key, route?.params?.userId])
  );

  const profileUserId = route?.params?.userId || currentUserId;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  // Edit Bio Modal State
  const [showBioModal, setShowBioModal] = useState(false);
  const [editingBio, setEditingBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  // Profile Picture Upload State
  const [uploadingPic, setUploadingPic] = useState(false);

  const profile = allProfiles[profileUserId || ''];
  const isOwnProfile = profileUserId === currentUserId;

  // Load initial posts with pagination
  useEffect(() => {
    if (!profileUserId) return;

    const loadInitialPosts = async () => {
      try {
        const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');
        const q = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          firestoreLimit(POSTS_PER_PAGE)
        );

        const snapshot = await getDocs(q);
        const allPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        const userPosts = allPosts.filter(post => post.userId === profileUserId);
        setPosts(userPosts);

        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }

        setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
        setLoading(false);
      } catch (error) {
        console.error('Profile posts error:', error);
        setLoading(false);
      }
    };

    loadInitialPosts();

  }, [profileUserId, isOwnProfile, profile]);

  // Load more posts
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');
      const q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        firestoreLimit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const morePosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      const userPosts = morePosts.filter(post => post.userId === profileUserId);
      setPosts(prev => [...prev, ...userPosts]);

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Load more posts error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ],
    );
  };

  const handleLike = async (postId: string, likedBy: string[]) => {
    if (!currentUserId) return;
  
    const isLiked = likedBy.includes(currentUserId);
    const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', postId);
  
    try {
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(currentUserId) : arrayUnion(currentUserId),
      });
    } catch (error) {
      console.error('Like toggle error:', error);
    }
  };

  const handleReact = async (postId: string, reactionType: 'heart' | 'fire' | 'laugh' | 'clap' | 'heart_eyes' | 'sparkles') => {
    if (!currentUserId) return;
  
    const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;
  
    const currentReactions = post.reactions?.[reactionType] || [];
    const hasReacted = currentReactions.includes(currentUserId);
  
    try {
      await updateDoc(postRef, {
        [`reactions.${reactionType}`]: hasReacted ? arrayRemove(currentUserId) : arrayUnion(currentUserId),
        [`reactionCounts.${reactionType}`]: hasReacted 
          ? (post.reactionCounts?.[reactionType] || 1) - 1 
          : (post.reactionCounts?.[reactionType] || 0) + 1,
      });
    } catch (error) {
      console.error('React toggle error:', error);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!isOwnProfile || !currentUserId) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      setUploadingPic(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const filename = `profiles/${currentUserId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore profile
      const profileRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', currentUserId);
      await updateDoc(profileRef, {
        profilePictureUrl: downloadURL,
      });

      // Update AuthContext
      setUserProfile(userChannel || '', downloadURL);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Profile picture updated!');
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      Alert.alert('Error', `Failed to upload picture: ${error.message}`);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleEditBio = () => {
    setEditingBio(profile?.bio || '');
    setShowBioModal(true);
  };

  const handleSaveBio = async () => {
    if (!currentUserId) return;

    setSavingBio(true);
    try {
      const profileRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', currentUserId);
      await updateDoc(profileRef, {
        bio: editingBio.trim(),
      });

      setShowBioModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Bio updated!');
    } catch (error: any) {
      console.error('Bio update error:', error);
      Alert.alert('Error', `Failed to update bio: ${error.message}`);
    } finally {
      setSavingBio(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={currentUserId}
      profile={profile}
      onLike={handleLike}
      onReact={handleReact}
      onComment={() => { }}
      onViewProfile={() => { }}
    />
  );

  const displayChannel = profile?.channel || userChannel || '@unknown';
  const profilePic = profile?.profilePictureUrl;
  const initials = displayChannel.replace('@', '').substring(0, 2).toUpperCase();
  const postsCount = posts.length;

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.profileBanner}>
        <TouchableOpacity
          onPress={isOwnProfile ? handleProfilePictureUpload : undefined}
          disabled={uploadingPic}
          activeOpacity={isOwnProfile ? 0.7 : 1}
        >
          {uploadingPic ? (
            <View style={styles.profilePic}>
              <ActivityIndicator size="large" color={COLORS.cyan400} />
            </View>
          ) : profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profilePic} />
          ) : (
            <LinearGradient
              colors={getGradientForChannel(displayChannel)}
              style={styles.profilePic}
            >
              <Text style={styles.profileInitials}>{initials}</Text>
            </LinearGradient>
          )}
          {isOwnProfile && !uploadingPic && (
            <View style={styles.editIconContainer}>
              <Icon name="camera" size={16} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.profileInfo}>
        <Text style={styles.profileChannel}>{displayChannel}</Text>

        {/* Bio Section */}
        {(profile?.bio || isOwnProfile) && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>
              {profile?.bio || (isOwnProfile ? 'Tap to add bio' : 'No bio yet')}
            </Text>
            {isOwnProfile && (
              <TouchableOpacity onPress={handleEditBio} style={styles.editBioButton}>
                <Icon name="create-outline" size={18} color={COLORS.cyan400} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.canvasesCreated || 0}</Text>
            <Text style={styles.statLabel}>Canvases</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.followerCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {isOwnProfile && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Icon name="log-out-outline" size={18} color={COLORS.red400} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Posts</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.cyan400} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="reload-outline" size={40} color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            icon="file-text"
            title="No Posts Yet"
            subtitle={
              isOwnProfile
                ? 'Start sharing your thoughts!'
                : `${displayChannel} hasn't posted anything yet.`
            }
          />
        }
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

      {/* Edit Bio Modal */}
      <Modal
        visible={showBioModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBioModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Bio</Text>
            <TextInput
              style={styles.bioInput}
              value={editingBio}
              onChangeText={setEditingBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={COLORS.slate500}
              multiline
              maxLength={160}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{editingBio.length}/160</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBioModal(false)}
                disabled={savingBio}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveBio}
                disabled={savingBio}
              >
                {savingBio ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getGradientForChannel = (channel: string): readonly [string, string] => {
  const colors = [
    [COLORS.indigo600, COLORS.pink600] as const,
    [COLORS.cyan500, COLORS.indigo600] as const,
    [COLORS.teal500, COLORS.green600] as const,
  ];
  return colors[(channel?.length || 0) % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.cyan400,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  profileHeader: {
    backgroundColor: COLORS.slate900,
  },
  profileBanner: {
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.cyan500,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.slate900,
  },
  profileInfo: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  profileChannel: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 12,
  },
  bioSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    maxWidth: '100%',
  },
  bioText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray200,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  editBioButton: {
    marginLeft: 8,
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.cyan400,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.slate400,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.red500}20`,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  signOutText: {
    color: COLORS.red400,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.slate800,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.slate800,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 16,
  },
  bioInput: {
    backgroundColor: COLORS.slate900,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.white,
    minHeight: 100,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.slate700,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.cyan500,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;