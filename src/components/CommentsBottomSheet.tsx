// src/components/CommentsBottomSheet.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, getDocs } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import { CanvasComment, ReactionType } from '../types/canvas';
import { useAuth } from '../context/AuthContext';
import {
  addComment,
  deleteComment,
  toggleCanvasReaction,
  fetchCommentsQuery,
  fetchRepliesQuery,
} from '../utils/commentsApi';
import ReactionPicker from './ReactionPicker';
import CommentItem from './CommentItem';

interface CommentsBottomSheetProps {
  visible: boolean;
  canvasId: string;
  canvasTitle: string;
  canvasCreatorId: string;
  canvasReactions: {
    heart: string[];
    fire: string[];
    laugh: string[];
    clap: string[];
    heart_eyes: string[];
    sparkles: string[];
  };
  onClose: () => void;
}

const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  visible,
  canvasId,
  canvasTitle,
  canvasCreatorId,
  canvasReactions,
  onClose,
}) => {
  const { userId, userChannel } = useAuth();
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [replies, setReplies] = useState<{ [commentId: string]: CanvasComment[] }>({});
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // Fetch comments with real-time updates
  useEffect(() => {
    if (!visible || !canvasId) return;

    setLoading(true);
    const q = fetchCommentsQuery(canvasId, sortBy, 50);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: CanvasComment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as CanvasComment);
      });

      // Sort by popular if selected (client-side)
      if (sortBy === 'popular') {
        commentsData.sort((a, b) => {
          const aTotal = Object.values(a.reactionCounts).reduce((sum, val) => sum + val, 0);
          const bTotal = Object.values(b.reactionCounts).reduce((sum, val) => sum + val, 0);
          return bTotal - aTotal;
        });
      }

      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [visible, canvasId, sortBy]);

  // Handle canvas reaction
  const handleCanvasReact = async (reactionType: ReactionType) => {
    if (!userId) return;
    try {
      await toggleCanvasReaction(canvasId, userId, reactionType);
    } catch (error) {
      console.error('Canvas react error:', error);
    }
  };

  // Handle post comment
  const handlePostComment = async () => {
    if (!commentText.trim() || !userId || !userChannel) return;

    setPosting(true);
    try {
      await addComment(
        canvasId,
        userId,
        userChannel,
        null,
        commentText.trim(),
        replyingTo?.id || null
      );

      setCommentText('');
      setReplyingTo(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Post comment error:', error);
      Alert.alert('Error', 'Could not post comment');
    } finally {
      setPosting(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(canvasId, commentId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Delete comment error:', error);
      Alert.alert('Error', 'Could not delete comment');
    }
  };

  // Handle reply
  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
  };

  // Handle view replies
  const handleViewReplies = async (commentId: string) => {
    const isExpanded = expandedComments.has(commentId);

    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedComments);
      newExpanded.delete(commentId);
      setExpandedComments(newExpanded);
    } else {
      // Expand - fetch replies
      const q = fetchRepliesQuery(canvasId, commentId);
      const snapshot = await getDocs(q);
      const repliesData: CanvasComment[] = [];
      snapshot.forEach((doc) => {
        repliesData.push({ id: doc.id, ...doc.data() } as CanvasComment);
      });

      setReplies((prev) => ({ ...prev, [commentId]: repliesData }));

      const newExpanded = new Set(expandedComments);
      newExpanded.add(commentId);
      setExpandedComments(newExpanded);
    }
  };

  const renderComment = ({ item }: { item: CanvasComment }) => {
    const commentReplies = replies[item.id] || [];
    const isExpanded = expandedComments.has(item.id);

    return (
      <View>
        <CommentItem
          comment={item}
          canvasId={canvasId}
          canvasCreatorId={canvasCreatorId}
          currentUserId={userId || ''}
          onReply={handleReply}
          onDelete={handleDeleteComment}
          onViewReplies={handleViewReplies}
        />

        {/* Render Replies */}
        {isExpanded && commentReplies.length > 0 && (
          <View style={styles.repliesContainer}>
            {commentReplies.map((reply) => (
              <View key={reply.id} style={styles.replyItem}>
                <View style={styles.replyLine} />
                <View style={{ flex: 1 }}>
                  <CommentItem
                    comment={reply}
                    canvasId={canvasId}
                    canvasCreatorId={canvasCreatorId}
                    currentUserId={userId || ''}
                    onReply={() => { }} // No nested replies
                    onDelete={handleDeleteComment}
                    onViewReplies={() => { }} // No nested replies
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              💬 Comments ({comments.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Canvas Reactions */}
          <View style={styles.reactionsSection}>
            <Text style={styles.sectionTitle}>Reactions</Text>
            <ReactionPicker
              currentReactions={canvasReactions}
              userId={userId || ''}
              onReact={handleCanvasReact}
            />
          </View>

          {/* Sort Options */}
          <View style={styles.sortRow}>
            {(['newest', 'oldest', 'popular'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSortBy(option)}
                style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
              >
                <Text style={[styles.sortText, sortBy === option && styles.sortTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.cyan400} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.slate600} />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to comment!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input Field */}
          <View style={styles.inputContainer}>
            {replyingTo && (
              <View style={styles.replyingBanner}>
                <Text style={styles.replyingText}>
                  Replying to @{replyingTo.username}
                </Text>
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.slate400} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor={COLORS.slate500}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handlePostComment}
                disabled={!commentText.trim() || posting}
                style={[
                  styles.postButton,
                  (!commentText.trim() || posting) && styles.postButtonDisabled,
                ]}
              >
                {posting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingBottom: 0,  // Remove padding, let inputContainer handle it
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.slate700,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    padding: 4,
  },
  reactionsSection: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate400,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
  },
  sortButtonActive: {
    backgroundColor: COLORS.cyan400,
  },
  sortText: {
    fontSize: 14,
    color: COLORS.slate400,
    fontWeight: '500',
  },
  sortTextActive: {
    color: COLORS.slate900,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate500,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate600,
    marginTop: 4,
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100,  // 🆕 ADD THIS - gives space above input
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  replyLine: {
    width: 2,
    backgroundColor: COLORS.cyan400,
    marginRight: 12,
    borderRadius: 1,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
    backgroundColor: COLORS.slate900,
    paddingBottom: Platform.OS === 'ios' ? 34 : 60,  // Increased padding
    marginBottom: Platform.OS === 'android' ? 20 : 0,  // Add margin for Android
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.slate800,
  },
  replyingText: {
    fontSize: 13,
    color: COLORS.cyan400,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.slate800,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 14,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: COLORS.cyan400,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  postButtonDisabled: {
    backgroundColor: COLORS.slate700,
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate900,
  },
});

export default CommentsBottomSheet;
