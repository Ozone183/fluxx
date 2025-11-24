import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, where, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS } from '../theme/colors';
import { ReactionType } from '../data/reactions';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import CanvasStoriesBar from '../components/CanvasStoriesBar';
import DailyCheckInModal from '../components/DailyCheckInModal';
import TokenClaimedCelebration from '../components/TokenClaimedCelebration';
import { checkDailyCheckInEligibility, processDailyCheckIn } from '../utils/tokens';
import { useRef } from 'react';

interface Post {
  id: string;
  userId: string;
  userChannel: string;
  content: string;
  image?: string | null;
  timestamp: any;
  likedBy: string[];
  commentsCount: number;
  canvasId?: string;
  canvasData?: {
    title?: string;
    thumbnail?: string;
  };
  // 🆕 NEW REACTION FIELDS - ALL 80 REACTIONS
  reactions?: Record<string, string[]>;
  reactionCounts?: Record<string, number>;
  // 🎥 VIDEO POST FIELDS
  type?: 'image' | 'video';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

const FeedScreen = () => {
  const navigation = useNavigation();
  const route = useRoute(); // ✅ ADD THIS LINE
  const { userId, userChannel } = useAuth();
  const { allProfiles } = useProfiles();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [checkInData, setCheckInData] = useState({ tokens: 0, streak: 0 });
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  // 🆕 ADD THIS CALLBACK
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const ids = viewableItems.map(item => item.item.id);
    setVisiblePostIds(ids);
  }).current;

  // Daily Check-In Logic (prevent multiple checks per session)
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!userId || hasCheckedRef.current) return;

    const checkForDailyCheckIn = async () => {
      try {
        const isEligible = await checkDailyCheckInEligibility(userId);

        if (isEligible) {
          console.log('🪙 User is eligible for daily check-in');

          // Mark as checked for this session
          hasCheckedRef.current = true;

          // Process check-in
          const result = await processDailyCheckIn(userId);

          if (result.success) {
            console.log('🎉 Setting check-in data:', result);
            setCheckInData({
              tokens: result.tokens,
              streak: result.streak,
            });

            console.log('🎉 About to show modal in 1 second...');
            // Show modal after a short delay
            setTimeout(() => {
              console.log('🎉 SHOWING MODAL NOW!');
              setShowCheckInModal(true);
            }, 1000);
          }
        } else {
          console.log('🪙 User already checked in today');
          hasCheckedRef.current = true; // Mark as checked to prevent re-checking
        }
      } catch (error) {
        console.error('Daily check-in error:', error);
      }
    };

    checkForDailyCheckIn();
  }, [userId]);

  // ✅ KEEP YOUR NOTIFICATION LISTENER - DON'T DELETE
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
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null); // ✅ ADD THIS LINE

  // Pagination state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;

  const scrollY = new Animated.Value(0);

  // Reset video state when returning to feed
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, trigger video detection
      setPlayingVideoId(null);

      return () => {
        // When leaving, stop videos
        setPlayingVideoId(null);
      };
    }, [])
  );

  // Paginated posts loader
  const loadPosts = async (isLoadMore = false) => {
    if (isLoadMore && (!hasMore || isLoadingMore)) return;

    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setLastVisible(null);
        setHasMore(true);
      }

      const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');

      let postsQuery = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        limit(POSTS_PER_PAGE)
      );

      if (isLoadMore && lastVisible) {
        postsQuery = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(postsQuery);

      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      if (isLoadMore) {
        setPosts(prev => [...prev, ...fetchedPosts]);
      } else {
        setPosts(fetchedPosts);
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(fetchedPosts.length === POSTS_PER_PAGE);

    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    loadPosts();
  }, []);

  // Scroll to specific post if coming from notification
  useEffect(() => {
    const scrollToPostId = (route.params as any)?.scrollToPostId;

    if (scrollToPostId && posts.length > 0 && flatListRef.current) {
      const postIndex = posts.findIndex(p => p.id === scrollToPostId);

      if (postIndex !== -1) {
        // Small delay to ensure list is rendered
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: postIndex,
            animated: true,
            viewPosition: 0.5, // Center the post
          });
        }, 300);
      }
    }
  }, [(route.params as any)?.scrollToPostId, posts]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadPosts(false); // Reload from start
  }, [loadPosts]);

  // Real-time listener for NEW posts and DELETIONS
  useEffect(() => {
    if (posts.length === 0) return; // Wait for initial load

    const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');
    const latestPostTime = posts[0]?.timestamp;

    if (!latestPostTime) return;

    // Listen only for posts NEWER than what we have
    const q = query(
      postsRef,
      where('timestamp', '>', latestPostTime),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      if (newPosts.length > 0) {
        // ✅ DEDUPLICATION: Remove any posts with IDs that already exist
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...uniqueNewPosts, ...prev];
        });
      }
    });

    return () => unsubscribe();
  }, [posts.length > 0 ? posts[0]?.id : null]);

  // Real-time listener for DELETIONS (all loaded posts)
  useEffect(() => {
    if (posts.length === 0) return;

    const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');

    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
      const currentPostIds = new Set(snapshot.docs.map(doc => doc.id));

      // Remove any posts that no longer exist in Firestore
      setPosts(prev => prev.filter(post => currentPostIds.has(post.id)));
    });

    return () => unsubscribe();
  }, [posts.length > 0]);

  // Real-time listener for post UPDATES using docChanges()
  useEffect(() => {
    if (posts.length === 0) return;

    const postsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts');

    // Listen to the entire posts collection
    const unsubscribe = onSnapshot(postsRef, (snapshot) => {
      // Only process modifications (not additions or deletions)
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const updatedPost = { id: change.doc.id, ...change.doc.data() } as Post;

          // Only update if this post is in our current feed
          setPosts(prev =>
            prev.map(post =>
              post.id === updatedPost.id ? updatedPost : post
            )
          );

          console.log('📝 Post updated in real-time:', updatedPost.id);
        }
      });
    });

    return () => unsubscribe();
  }, [posts.length > 0]); // Only re-subscribe when posts go from 0 to >0

  // Handle like toggle (old heart button)
  const handleLike = async (postId: string, likedBy: string[]) => {
    if (!userId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isLiked = likedBy.includes(userId);
    const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', postId);

    try {
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      });

      if (!isLiked) {
        try {
          const post = posts.find(p => p.id === postId);

          if (post && post.userId && post.userId !== userId) {
            const { createNotification } = await import('../utils/notifications');

            await createNotification({
              recipientUserId: post.userId,
              type: 'like',
              fromUserId: userId,
              fromUsername: userChannel || '@unknown',
              fromProfilePic: null,
              relatedCanvasId: postId,
            });
          }
        } catch (notifError) {
          console.error('Notification creation failed:', notifError);
        }
      }
    } catch (error) {
      console.error('Like toggle error:', error);
    }
  };

  // 🆕 NEW: Handle reaction toggle
  const handleReact = async (postId: string, reactionType: ReactionType) => {
    if (!userId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const currentReactions = post.reactions?.[reactionType] || [];
    const hasReacted = currentReactions.includes(userId);

    const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', postId);

    try {
      await updateDoc(postRef, {
        [`reactions.${reactionType}`]: hasReacted ? arrayRemove(userId) : arrayUnion(userId),
        [`reactionCounts.${reactionType}`]: hasReacted ? (post.reactionCounts?.[reactionType] || 1) - 1 : (post.reactionCounts?.[reactionType] || 0) + 1,
      });

      // CREATE NOTIFICATION FOR REACTION (only when reacting, not unreacting)
      if (!hasReacted && post.userId !== userId) {
        try {
          const { createNotification } = await import('../utils/notifications');

          await createNotification({
            recipientUserId: post.userId,
            type: 'like', // We can reuse 'like' notification type
            fromUserId: userId,
            fromUsername: userChannel || '@unknown',
            fromProfilePic: null,
            relatedCanvasId: postId,
          });
        } catch (notifError) {
          console.error('Notification creation failed:', notifError);
        }
      }
    } catch (error) {
      console.error('React toggle error:', error);
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

  // Handle delete post
  const handleDeletePost = async (post: Post) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deletePost } = await import('../services/postsApi-video');
              await deletePost(post.id, post.videoUrl, post.thumbnailUrl, post.image);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Optimistically remove from UI
              setPosts(prev => prev.filter(p => p.id !== post.id));
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ]
    );
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
      onReact={handleReact}
      onComment={handleComments}
      onViewProfile={handleViewProfile}
      onDelete={handleDeletePost}
      playingVideoId={playingVideoId}
      onVideoPlay={(postId) => setPlayingVideoId(postId)}
      pauseCarouselMusic={!visiblePostIds.includes(item.id)}
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

      {/* ✅ STICKY CANVAS STORIES */}
      <View style={styles.stickyCanvasBar}>
        <CanvasStoriesBar />
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}

        // Memory optimization
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}

        // Pagination
        onEndReached={() => loadPosts(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.cyan400} />
            </View>
          ) : null
        }

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
        onViewableItemsChanged={({ viewableItems }) => {
          // Track visible post IDs for carousel music pause
          const ids = viewableItems.map(item => item.item.id);
          setVisiblePostIds(ids);
        
          // Find the first visible video post
          const visibleVideo = viewableItems.find(
            item => item.isViewable && (item.item as Post).type === 'video'
          );
        
          if (visibleVideo) {
            setPlayingVideoId((visibleVideo.item as Post).id);
          } else {
            setPlayingVideoId(null);
          }
        }}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Daily Check-In Modal */}
      <DailyCheckInModal
        visible={showCheckInModal}
        onClose={() => {
          setShowCheckInModal(false);
          // Show celebration after closing check-in modal
          setTimeout(() => {
            setShowCelebration(true);
          }, 300);
        }}
        tokensEarned={checkInData.tokens}
        streak={checkInData.streak}
      />

      {/* Token Claimed Celebration */}
      <TokenClaimedCelebration
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
        tokensEarned={checkInData.tokens}
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
  stickyCanvasBar: {
    backgroundColor: COLORS.slate900,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
    zIndex: 5,
  },
});

export default FeedScreen;