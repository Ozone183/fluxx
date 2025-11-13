import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, where, query, orderBy } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import CanvasStoriesBar from '../components/CanvasStoriesBar'; // ← ADD THIS

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

const FeedScreen = () => {
  const navigation = useNavigation();
  const { userId, userChannel } = useAuth();
  const { allProfiles } = useProfiles();
  const [unreadCount, setUnreadCount] = useState(0); // ← ADD THIS

  // ✅ ADD THIS ENTIRE useEffect BLOCK:
  useEffect(() => {
    if (!userId) return;

    const notificationsRef = collection(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'notifications',
      userId,
      'items'
    );

    const q = query(notificationsRef, where('isRead', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [userId]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollY = new Animated.Value(0);

  // Real-time posts listener
  useEffect(() => {
    const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');

    const unsubscribe = onSnapshot(
      postsRef,
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        // Sort by timestamp (newest first)
        fetchedPosts.sort(
          (a, b) =>
            (b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0) -
            (a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0),
        );

        setPosts(fetchedPosts);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Feed snapshot error:', error);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Handle like toggle
  const handleLike = async (postId: string, likedBy: string[]) => {
    if (!userId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isLiked = likedBy.includes(userId);
    const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', postId);

    try {
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (error) {
      console.error('Like toggle error:', error);
    }
  };

  // Navigate to comments
  const handleComments = (post: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate('Comments', { post });
  };

  // Navigate to profile
  const handleViewProfile = (profileUserId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate('Profile', { userId: profileUserId });
  };

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      currentUserId={userId}
      profile={allProfiles[item.userId]}
      onLike={handleLike}
      onComment={handleComments}
      onViewProfile={handleViewProfile}
    />
  );

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={[COLORS.slate900, COLORS.slate800]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
  <Text style={styles.headerTitle}>
    FLUX<Text style={styles.headerAccent}>X</Text>
  </Text>
  
  <View style={styles.headerRight}>
    <View style={styles.headerBadge}>
      <Icon name="flash-outline" size={16} color={COLORS.cyan400} />
      <Text style={styles.headerChannel}>{userChannel}</Text>
    </View>

    {/* ✅ ADD BELL BUTTON HERE */}
    <TouchableOpacity 
      style={styles.bellButton}
      onPress={() => (navigation as any).navigate('Notifications')}
    >
      <Icon name="notifications-outline" size={24} color={COLORS.white} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
</View>
      </LinearGradient>
    </Animated.View>
  );

  // ← ADD THIS: Canvas Stories at top of list
  const renderListHeader = () => (
    <CanvasStoriesBar />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="reload-outline" size={40} color={COLORS.cyan400} />
        <Text style={styles.loadingText}>Loading Feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderListHeader} // ← ADD THIS
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.cyan400}
            colors={[COLORS.cyan400]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="No Flux Yet"
            subtitle="Be the first to share something amazing!"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 4,
  },
  headerAccent: {
    color: COLORS.cyan400,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  headerChannel: {
    color: COLORS.cyan400,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.red500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.slate900,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default FeedScreen;