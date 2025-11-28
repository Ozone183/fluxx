import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import ReactionPicker from './ReactionPicker';
import { ReactionType } from '../data/reactions';
import VideoPlayer from './VideoPlayer';
import { ImageCarouselViewer } from './ImageCarouselViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Post {
  id: string;
  userId: string;
  userChannel: string;
  content: string;
  image?: string | null;
  timestamp: any;
  likedBy: string[];
  commentsCount: number;
  // 🆕 NEW REACTION FIELDS - ALL 80 REACTIONS
  reactions?: Record<string, string[]>;
  reactionCounts?: Record<string, number>;
  // 🎥 VIDEO POST FIELDS
  type?: 'image' | 'video' | 'carousel';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  isProcessing?: boolean;  // ← ADD THIS
  images?: string[];      // Array of image URLs for carousel
  musicUrl?: string;      // Background music URL for carousel
  musicTitle?: string;
  shares?: number;
  coverImageIndex?: number;
}

interface Profile {
  userId: string;
  channel: string;
  profilePictureUrl: string | null;
  userChannel?: string;
}

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  profile: Profile | null;
  onLike: (postId: string, likedBy: string[]) => void;
  onReact: (postId: string, reactionType: ReactionType) => void;
  onComment: (post: Post) => void;
  onViewProfile: (userId: string) => void;
  onDelete: (post: Post) => void;
  playingVideoId?: string | null;
  onVideoPlay?: (postId: string) => void;
  pauseCarouselMusic?: boolean; // 🆕 ADD THIS LINE
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  profile,
  onLike,
  onReact,
  onComment,
  onViewProfile,
  onDelete,
  playingVideoId,
  onVideoPlay,
  pauseCarouselMusic = false
}) => {
  const [showReactions, setShowReactions] = React.useState(false);  // ← ADD THIS
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const isLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false;

  const likesCount = post.likedBy?.length || 0;
  const commentsCount = post.commentsCount || 0;

  // Reaction calculations
  const reactionCounts = post.reactionCounts || {};
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const timestamp = post.timestamp?.toDate
    ? post.timestamp.toDate()
    : new Date();
  const timeAgo = getTimeAgo(timestamp);

  const displayChannel = profile?.channel || post.userChannel || '@unknown';
  const profilePicUrl = profile?.profilePictureUrl;
  const initials = getInitials(displayChannel);

  // Share function with deep link + token reward
  const handleShare = async () => {
    try {
      const postUrl = `fluxx://post/${post.id}`;
      const message = `Check out this post by ${displayChannel} on Fluxx!\n\n"${post.content}"\n\n${postUrl}`;

      const result = await Share.share({
        message: message,
        title: `Post from ${displayChannel}`,
      });

      if (result.action === Share.sharedAction && currentUserId) {
        console.log('Post shared successfully');

        // AWARD TOKENS FOR SHARING
        try {
          const { awardTokens } = await import('../utils/tokens');
          await awardTokens({
            userId: currentUserId,
            amount: 3,
            type: 'share',
            description: 'Shared a post',
            relatedId: post.id,
          });
          console.log('🪙 Awarded 3 tokens for sharing post');

          // Show success feedback
          Alert.alert('Tokens Earned! 💎', 'You earned 3 tokens for sharing!');
        } catch (tokenError) {
          console.error('Token award error:', tokenError);
        }
      }
    } catch (error: any) {
      Alert.alert('Share Failed', error.message);
    }
  };

  return (
    <View style={styles.postContainer}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.header}
            onPress={() => onViewProfile(post.userId)}
            activeOpacity={0.7}
          >
            {profilePicUrl ? (
              <Image
                source={{ uri: profilePicUrl }}
                style={styles.profilePic}
                resizeMode={'cover'}
              />
            ) : (
              <LinearGradient
                colors={getGradientForChannel(displayChannel)}
                style={styles.profilePic}
              >
                <Text style={styles.initials}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.channel}>{displayChannel}</Text>
              <Text style={styles.timestamp}>{timeAgo}</Text>
            </View>
          </TouchableOpacity>

          {/* 3-dot menu - Instagram style */}
          <TouchableOpacity
            onPress={() => setShowOptionsMenu(true)}
            style={styles.optionsButton}
            activeOpacity={0.7}
          >
            <Icon name="ellipsis-horizontal" size={20} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Width Image, Video, or Carousel */}
      {post.type === 'carousel' && post.images && post.images.length > 0 ? (
        <ImageCarouselViewer
        images={post.images}
        musicUrl={post.musicUrl}
        musicTitle={post.musicTitle}
        autoPlayMusic={false}  // ✅ DON'T AUTO-PLAY MUSIC
        pauseMusic={pauseCarouselMusic}
        onImageChange={(index) => {
          console.log(`Viewing image ${index + 1} of ${post.images?.length}`);
        }}
      />
      ) : post.type === 'video' && post.videoUrl ? (
        post.isProcessing ? (
          // Show processing indicator
          <View style={styles.processingContainer}>
            <View style={styles.processingContent}>
              <Icon name="hourglass-outline" size={48} color={COLORS.cyan400} />
              <Text style={styles.processingText}>Processing video...</Text>
              <Text style={styles.processingSubtext}>This will take a moment</Text>
            </View>
            {post.thumbnailUrl && (
              <Image
                source={{ uri: post.thumbnailUrl }}
                style={styles.processingThumbnail}
                blurRadius={10}
              />
            )}
          </View>
        ) : (
          <VideoPlayer
            videoUrl={post.videoUrl}
            thumbnailUrl={post.thumbnailUrl}
            style={styles.videoContainer}
            isPlaying={playingVideoId === post.id}
            onPlayingChange={(playing) => {
              if (playing && onVideoPlay) {
                onVideoPlay(post.id);
              }
            }}
          />
        )
      ) : post.image ? (
        <Image
          source={{ uri: post.image }}
          style={styles.fullWidthImage}
          resizeMode={'cover'}
        />
      ) : null}

      {/* Content Card */}
      <View style={styles.contentCard}>
        <Text style={styles.content}>{post.content}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {/* React Button */}
          <TouchableOpacity
            style={[styles.actionButton, totalReactions > 0 && styles.hasReactionsButton]}
            onPress={() => setShowReactions(!showReactions)}
            activeOpacity={0.7}
          >
            <Icon
              name={showReactions ? "close-circle" : "happy-outline"}
              size={20}
              color={totalReactions > 0 ? COLORS.cyan400 : COLORS.slate400}
            />
            <Text
              style={[styles.actionText, totalReactions > 0 && styles.hasReactionsText]}
            >
              {totalReactions > 0 ? totalReactions : 'React'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={() => onLike(post.id, post.likedBy || [])}
            activeOpacity={0.7}
          >
            <Icon
              name="heart"
              size={20}
              color={isLiked ? COLORS.red400 : COLORS.slate400}
              style={isLiked ? styles.heartFilled : undefined}
            />
            <Text
              style={[styles.actionText, isLiked && styles.likedText]}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post)}
            activeOpacity={0.7}
          >
            <Icon name="chatbubble-outline" size={20} color={COLORS.slate400} />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.7}
            onPress={handleShare}
          >
            <Icon name="paper-plane-outline" size={20} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>

        {showReactions && (
          <View style={styles.reactionsContainer}>
            <ReactionPicker
              currentReactions={post.reactions || {}}
              userId={currentUserId || ''}
              onReact={(reactionType) => {
                onReact(post.id, reactionType);
                setShowReactions(false);
              }}
            />
          </View>
        )}

      </View>

      {/* Options Modal - Instagram Style */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.optionsModal}>
              {currentUserId === post.userId && (
                <>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      onDelete(post);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="trash-outline" size={22} color={COLORS.red500} />
                    <Text style={styles.deleteOptionText}>Delete</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerLine} />
                </>
              )}

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setShowOptionsMenu(false)}
                activeOpacity={0.7}
              >
                <Icon name="flag-outline" size={22} color={COLORS.slate300} />
                <Text style={styles.optionText}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setShowOptionsMenu(false)}
                activeOpacity={0.7}
              >
                <Icon name="link-outline" size={22} color={COLORS.slate300} />
                <Text style={styles.optionText}>Copy Link</Text>
              </TouchableOpacity>

              <View style={styles.dividerLine} />

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => setShowOptionsMenu(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, { marginLeft: 0 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Helper functions
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
};

const getInitials = (channel: string): string => {
  return channel.replace('@', '').substring(0, 2).toUpperCase();
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
  postContainer: {
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: COLORS.slate800,
    marginHorizontal: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    paddingBottom: 12,
    borderWidth: 0,
    borderBottomWidth: 0,
    borderColor: COLORS.slate700,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  initials: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  channel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.slate400,
  },
  fullWidthImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    marginHorizontal: 0,
    backgroundColor: COLORS.slate700,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 9 / 16,
    marginHorizontal: 0,
    backgroundColor: '#000',
  },
  contentCard: {
    backgroundColor: COLORS.slate800,
    marginHorizontal: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 16,
    paddingTop: 12,
    borderWidth: 0,
    borderTopWidth: 0,
    borderColor: COLORS.slate700,
  },
  content: {
    fontSize: 16,
    color: COLORS.gray200,
    lineHeight: 24,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate700,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  likedButton: {
    backgroundColor: `${COLORS.red500}20`,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
    marginLeft: 6,
  },
  likedText: {
    color: COLORS.red400,
  },
  heartFilled: {
    transform: [{ scale: 1.1 }],
  },
  spacer: {
    flex: 1,
  },
  hasReactionsButton: {
    backgroundColor: `${COLORS.cyan500}20`,
  },
  hasReactionsText: {
    color: COLORS.cyan400,
  },
  reactionsContainer: {
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  optionsButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: COLORS.slate800,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.slate700,
    marginHorizontal: 16,
  },
  optionText: {
    fontSize: 18,
    color: COLORS.white,
    marginLeft: 12,
    fontWeight: '500',
  },
  deleteOptionText: {
    fontSize: 18,
    color: COLORS.red500,
    marginLeft: 12,
    fontWeight: '700',
  },
  processingContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 9 / 16,
    backgroundColor: COLORS.slate900,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingThumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  processingContent: {
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 24,
    borderRadius: 16,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.cyan400,
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 8,
  },
});

export default PostCard;