// src/components/CommentItem.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { CanvasComment, ReactionType } from '../types/canvas';
import { toggleCommentReaction } from '../utils/commentsApi';

interface CommentItemProps {
  comment: CanvasComment;
  canvasId: string;
  canvasCreatorId: string;
  currentUserId: string;
  onReply: (commentId: string, username: string) => void;
  onDelete: (commentId: string) => void;
  onViewReplies: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  canvasId,
  canvasCreatorId,
  currentUserId,
  onReply,
  onDelete,
  onViewReplies,
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleReact = async (reactionType: ReactionType) => {
    try {
      await toggleCommentReaction(canvasId, comment.id, currentUserId, reactionType);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('React error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const totalReactions = Object.values(comment.reactionCounts).reduce((a, b) => a + b, 0);

  const textLimit = 150;
  const needsTruncate = comment.text.length > textLimit;
  const displayText = needsTruncate && !showFullText
    ? comment.text.substring(0, textLimit) + '...'
    : comment.text;

  const canDelete = currentUserId === comment.userId || currentUserId === canvasCreatorId;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Avatar */}
        {comment.userProfilePic ? (
          <Image source={{ uri: comment.userProfilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {comment.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Username & Time */}
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{comment.username}</Text>
          <Text style={styles.timestamp}>{getTimeAgo(comment.createdAt)}</Text>
        </View>

        {/* Delete Button */}
        {canDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={COLORS.red400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment Text */}
      <Text style={styles.text}>{displayText}</Text>
      {needsTruncate && (
        <TouchableOpacity onPress={() => setShowFullText(!showFullText)}>
          <Text style={styles.readMore}>
            {showFullText ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Actions Row */}
      <View style={styles.actions}>
        {/* Reply Button */}
        <TouchableOpacity
          onPress={() => onReply(comment.id, comment.username)}
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.cyan400} />
          <Text style={styles.actionText}>Reply</Text>
          {comment.replyCount > 0 && (
            <Text style={styles.actionCount}>({comment.replyCount})</Text>
          )}
        </TouchableOpacity>

        {/* Reactions Button */}
        {totalReactions > 0 && (
          <TouchableOpacity
            onPress={() => setShowReactions(!showReactions)}
            style={styles.actionButton}
          >
            <Ionicons name="happy-outline" size={16} color={COLORS.purple400} />
            <Text style={styles.actionText}>{totalReactions}</Text>
          </TouchableOpacity>
        )}

        {/* React Button */}
        <TouchableOpacity
          onPress={() => setShowReactions(!showReactions)}
          style={styles.actionButton}
        >
          <Ionicons
            name={showReactions ? "close-circle-outline" : "add-circle-outline"}
            size={16}
            color={COLORS.purple400}
          />
          <Text style={styles.actionText}>
            {showReactions ? 'Close' : 'React'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reactions Row (Expandable) */}
      {showReactions && (
        <View style={styles.reactionsRow}>
          {['heart', 'fire', 'laugh', 'clap', 'heart_eyes', 'sparkles'].map((type) => {
            const reactionType = type as ReactionType;
            const count = comment.reactionCounts[reactionType] || 0;
            const hasReacted = comment.reactions[reactionType]?.includes(currentUserId);
            const emoji = {
              heart: '❤️',
              fire: '🔥',
              laugh: '😂',
              clap: '👏',
              heart_eyes: '😍',
              sparkles: '✨',
            }[type];
            console.log('🔍 Reaction:', type, 'emoji:', emoji, 'count:', count);

            return (
              <TouchableOpacity
                key={type}
                onPress={() => handleReact(reactionType)}
                style={[styles.reactionButton, hasReacted && styles.reactionButtonActive]}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 0 && (
                  <Text style={[styles.reactionCount, hasReacted && styles.reactionCountActive]}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* View Replies Button */}
      {comment.replyCount > 0 && (
        <TouchableOpacity
          onPress={() => onViewReplies(comment.id)}
          style={styles.viewRepliesButton}
        >
          <Ionicons name="return-down-forward" size={14} color={COLORS.cyan400} />
          <Text style={styles.viewRepliesText}>
            View {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cyan400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  text: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 13,
    color: COLORS.cyan400,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.slate400,
  },
  actionCount: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.slate700,
    gap: 4,
  },
  reactionButtonActive: {
    backgroundColor: COLORS.slate600,
    borderWidth: 1,
    borderColor: COLORS.cyan400,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  reactionCountActive: {
    color: COLORS.cyan400,
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
  },
  viewRepliesText: {
    fontSize: 13,
    color: COLORS.cyan400,
    fontWeight: '500',
  },
});

export default CommentItem;
