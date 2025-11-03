import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Share,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

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

interface Profile {
  userId: string;
  channel: string;
  profilePictureUrl: string | null;
}

interface PostCardProps {
  post: Post;
  currentUserId: string | null;
  profile: Profile | null;
  onLike: (postId: string, likedBy: string[]) => void;
  onComment: (post: Post) => void;
  onViewProfile: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  profile,
  onLike,
  onComment,
  onViewProfile,
}) => {
  const isLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false;
  const likesCount = post.likedBy?.length || 0;
  const commentsCount = post.commentsCount || 0;

  const timestamp = post.timestamp?.toDate
    ? post.timestamp.toDate()
    : new Date();
  const timeAgo = getTimeAgo(timestamp);

  const displayChannel = profile?.channel || post.userChannel || '@unknown';
  const profilePicUrl = profile?.profilePictureUrl;
  const initials = getInitials(displayChannel);

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this post by ${displayChannel} on Fluxx:\n\n${post.content}`,
        title: `Post by ${displayChannel}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Post shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      Alert.alert('Share Error', error.message);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
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

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Image - Fixed with container wrapper */}
      {post.image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.image }}
            style={styles.postImage}
            resizeMode={'cover'}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
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
          <Icon name="paper-plane" size={20} color={COLORS.slate400} />
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: COLORS.slate800,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate700,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  content: {
    fontSize: 16,
    color: COLORS.gray200,
    lineHeight: 24,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: COLORS.slate700,
  },
  postImage: {
    width: '100%',
    height: 240,
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
});

export default PostCard;