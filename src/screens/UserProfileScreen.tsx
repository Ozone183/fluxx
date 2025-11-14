import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { APP_ID, useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';

const UserProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId: currentUserId } = useAuth();
  const { userId } = route.params as { userId: string };
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(
        doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId)
      );
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile(data);
        setIsFollowing(data.followers?.includes(currentUserId) || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');
      const q = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const userPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('📸 User posts loaded:', userPosts.length, userPosts); // ✅ ADD THIS

      
      setPosts(userPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || currentUserId === userId) return;

    try {
      setFollowLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const targetUserRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId);
      const currentUserRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', currentUserId);

      if (isFollowing) {
        await Promise.all([
          updateDoc(targetUserRef, {
            followers: arrayRemove(currentUserId),
            followerCount: increment(-1)
          }),
          updateDoc(currentUserRef, {
            following: arrayRemove(userId),
            followingCount: increment(-1)
          })
        ]);
        setIsFollowing(false);
      } else {
        await Promise.all([
          updateDoc(targetUserRef, {
            followers: arrayUnion(currentUserId),
            followerCount: increment(1)
          }),
          updateDoc(currentUserRef, {
            following: arrayUnion(userId),
            followingCount: increment(1)
          })
        ]);
        setIsFollowing(true);

        const { createNotification } = await import('../utils/notifications');
        const currentUserProfile = await getDoc(currentUserRef);
        const currentUserData = currentUserProfile.data();

        await createNotification({
          recipientUserId: userId,
          type: 'follow',
          fromUserId: currentUserId,
          fromUsername: currentUserData?.channel || '@unknown',
          fromProfilePic: currentUserData?.profilePictureUrl,
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      loadProfile();
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostPress = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post?.canvasId) {
      (navigation as any).navigate('CanvasEditor', { canvasId: post.canvasId });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="person-outline" size={64} color={COLORS.slate600} />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => handlePostPress(item.id)}  // Changed from item.canvasId to item.id
      activeOpacity={0.7}
    >
      {item.canvasData?.thumbnail ? (
        <Image source={{ uri: item.canvasData.thumbnail }} style={styles.postThumbnail} />
      ) : (
        <View style={styles.postPlaceholder}>
          <Icon name="image-outline" size={32} color={COLORS.slate600} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          @{profile.channel || profile.username || 'unknown'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {profile.profilePictureUrl ? (
            <Image
              source={{ uri: profile.profilePictureUrl }}
              style={styles.profilePic}
            />
          ) : (
            <View style={styles.avatarContainer}>
              <Icon name="person" size={48} color={COLORS.cyan400} />
            </View>
          )}
          
          <Text style={styles.username}>
            @{profile.channel || profile.username || 'unknown'}
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.canvasesCreated || 0}</Text>
              <Text style={styles.statLabel}>Canvases</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{profile.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Follow Button */}
          {currentUserId !== userId && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.followText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          
          {postsLoading ? (
            <ActivityIndicator size="large" color={COLORS.cyan400} style={{ marginTop: 40 }} />
          ) : posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="images-outline" size={48} color={COLORS.slate600} />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.postRow}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
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
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.slate400,
    marginTop: 16,
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
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 4,
  },
  followButton: {
    backgroundColor: COLORS.cyan500,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: COLORS.slate700,
  },
  followText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
  },
  postRow: {
    gap: 8,
    marginBottom: 8,
  },
  postCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.slate500,
    marginTop: 16,
  },
});

export default UserProfileScreen;