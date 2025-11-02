import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
}

const ProfileScreen = ({ route }: any) => {
  const { userId: currentUserId, userChannel, signOut } = useAuth();
  const { allProfiles } = useProfiles();
  const profileUserId = route?.params?.userId || currentUserId;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const profile = allProfiles[profileUserId || ''];
  const isOwnProfile = profileUserId === currentUserId;

  useEffect(() => {
    if (!profileUserId) return;

    const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');
    
    const unsubscribe = onSnapshot(
      postsRef,
      (snapshot) => {
        const allPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        const userPosts = allPosts
          .filter(post => post.userId === profileUserId)
          .sort(
            (a, b) =>
              (b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0) - 
              (a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0),
          );

        setPosts(userPosts);
        setLoading(false);
      },
      (error) => {
        console.error('Profile posts error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [profileUserId]);

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

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={currentUserId}
      profile={profile}
      onLike={handleLike}
      onComment={() => {}}
      onViewProfile={() => {}}
    />
  );

  const displayChannel = profile?.channel || userChannel || '@unknown';
  const profilePic = profile?.profilePictureUrl;
  const initials = displayChannel.replace('@', '').substring(0, 2).toUpperCase();
  const postsCount = posts.length;

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.profileBanner}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.profilePic} />
        ) : (
          <LinearGradient
            colors={getGradientForChannel(displayChannel)}
            style={styles.profilePic}
          >
            <Text style={styles.profileInitials}>{initials}</Text>
          </LinearGradient>
        )}
      </LinearGradient>

      <View style={styles.profileInfo}>
        <Text style={styles.profileChannel}>{displayChannel}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
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
        showsVerticalScrollIndicator={false}
      />
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.white,
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
    marginBottom: 16,
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
});

export default ProfileScreen;
