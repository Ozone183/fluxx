import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { collection, onSnapshot, addDoc, doc, updateDoc, increment, serverTimestamp, arrayRemove, arrayUnion, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import VoiceRecorder from '../components/VoiceRecorder';
import VoiceCommentPlayer from '../components/VoiceCommentPlayer';
import MentionDropdown from '../components/MentionDropdown';
import { useMentions } from '../hooks/useMentions';
import ClickableText from '../components/ClickableText';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { query, where } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';

interface Comment {
  id: string;
  userId: string;
  userChannel: string;
  content: string;
  voiceUrl?: string;
  voiceDuration?: number;
  timestamp: any;
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
  parentCommentId?: string | null;
  replyCount?: number;
}

type ReactionType = 'heart' | 'fire' | 'laugh' | 'clap' | 'heart_eyes' | 'sparkles';

const CommentsScreen = ({ route, navigation }: any) => {
  const { post: routePost } = route.params;
  const [post, setPost] = useState(routePost);
  const [loadingPost, setLoadingPost] = useState(!routePost?.userId);

  useEffect(() => {
    // If post doesn't have full data, load it
    if (!post?.userId && post?.id) {  // ✅ Added ?. operators
      const loadFullPost = async () => {
        try {
          const postDoc = await getDoc(
            doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', post.id)
          );
          if (postDoc.exists()) {
            setPost({ id: postDoc.id, ...postDoc.data() });
          }
        } catch (error) {
          console.error('Error loading post:', error);
        } finally {
          setLoadingPost(false);
        }
      };
      loadFullPost();
    }
  }, [post?.id]);  // ✅ Added ?. operator

  const { userId, userChannel } = useAuth();
  const { allProfiles } = useProfiles();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voiceDuration, setVoiceDuration] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [expandedReactions, setExpandedReactions] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<{ [commentId: string]: Comment[] }>({});
  const inputRef = React.useRef<TextInput>(null);  // ✅ ADD THIS LINE
  const mentionSystem = useMentions();

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]); // Username without @
    }
    
    return mentions;
  };

  const getUserIdFromChannel = async (username: string): Promise<string | null> => {
    try {
      const withAt = username.startsWith('@') ? username : `@${username}`;
      const withoutAt = username.startsWith('@') ? username.substring(1) : username;
      
      const profilesRef = collection(
        firestore,
        'artifacts',
        APP_ID,
        'public',
        'data',
        'profiles'
      );
      
      // Try with @ first
      let q = query(profilesRef, where('channel', '==', withAt));
      let snapshot = await getDocs(q);
      
      // If not found, try without @
      if (snapshot.empty) {
        q = query(profilesRef, where('channel', '==', withoutAt));
        snapshot = await getDocs(q);
      }
      
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('getUserIdFromChannel error:', error);
      return null;
    }
  };

  const navigateToUserProfile = async (username: string) => {
    try {
      console.log('🔍 Original username received:', username);
      
      // Try both with and without @ symbol
      const withAt = username.startsWith('@') ? username : `@${username}`;
      const withoutAt = username.startsWith('@') ? username.substring(1) : username;
      
      // Search profiles collection for this channel name
      const profilesRef = collection(
        firestore,
        'artifacts',
        APP_ID,
        'public',
        'data',
        'profiles'
      );
      
      // Try with @ first
      let q = query(profilesRef, where('channel', '==', withAt));
      let snapshot = await getDocs(q);
      
      // If not found, try without @
      if (snapshot.empty) {
        console.log('🔍 Not found with @, trying without...');
        q = query(profilesRef, where('channel', '==', withoutAt));
        snapshot = await getDocs(q);
      }
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const foundUserId = userDoc.id;
        console.log('✅ Found user:', foundUserId);
        
        navigation.navigate('Profile', { userId: foundUserId });
      } else {
        console.error('❌ User not found with either format:', withAt, withoutAt);
        
        // Debug: Let's see all profiles
        const allProfiles = await getDocs(profilesRef);
        console.log('📋 All channel names in DB:');
        allProfiles.forEach(doc => {
          console.log('  -', doc.data().channel);
        });
      }
    } catch (error) {
      console.error('Profile lookup error:', error);
    }
  };


  useEffect(() => {
    if (!post?.id) {
      console.error('❌ Cannot load comments - post ID is missing');
      return;
    }

    const commentsRef = collection(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'posts',
      post.id,
      'comments'
    );

    // Only fetch parent comments (where parentCommentId is null)
    const q = query(commentsRef, where('parentCommentId', '==', null));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];

        fetchedComments.sort(
          (a, b) =>
            (b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0) -
            (a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0),
        );

        setComments(fetchedComments);
      },
      (error) => {
        console.error('Comments snapshot error:', error);
      },
    );

    return () => unsubscribe();
  }, [post?.id]);

  const uploadVoiceToStorage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileName = `voice_${Date.now()}.m4a`;
    const storageRef = ref(storage, `voice-comments/posts/${post.id}/${fileName}`);

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
  };

  const handleSubmit = async () => {
    if ((!newComment.trim() && !voiceUrl) || !userId || !userChannel) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let uploadedVoiceUrl = voiceUrl;

      if (voiceUrl && voiceUrl.startsWith('file://')) {
        uploadedVoiceUrl = await uploadVoiceToStorage(voiceUrl);
      }

      const commentsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', post.id, 'comments');

      const commentData: any = {
        userId,
        userChannel,
        content: newComment.trim(),
        parentCommentId: replyingTo ? replyingTo.id : null,
        replyCount: 0,
        reactions: {
          heart: [],
          fire: [],
          laugh: [],
          clap: [],
          heart_eyes: [],
          sparkles: [],
        },
        reactionCounts: {
          heart: 0,
          fire: 0,
          laugh: 0,
          clap: 0,
          heart_eyes: 0,
          sparkles: 0,
        },
        timestamp: serverTimestamp(),
      };

      if (uploadedVoiceUrl) {
        commentData.voiceUrl = uploadedVoiceUrl;
        commentData.voiceDuration = voiceDuration || 0;
      }

      await addDoc(commentsRef, commentData);

      // If replying, increment parent comment reply count
      if (replyingTo) {
        const parentCommentRef = doc(
          firestore,
          'artifacts',
          APP_ID,
          'public',
          'data',
          'posts',
          post.id,
          'comments',
          replyingTo.id
        );
        await updateDoc(parentCommentRef, {
          replyCount: increment(1),
        });

        // SEND NOTIFICATION TO PARENT COMMENT AUTHOR
        try {
          // Get parent comment to find the author
          const parentCommentDoc = await getDoc(parentCommentRef);
          if (parentCommentDoc.exists()) {
            const parentCommentData = parentCommentDoc.data();
            const parentCommentAuthorId = parentCommentData.userId;

            // Only notify if replying to someone else
            if (parentCommentAuthorId && parentCommentAuthorId !== userId) {
              const { createNotification } = await import('../utils/notifications');

              // Get preview of comment text (first 50 chars)
              const commentPreview = parentCommentData.content 
                ? parentCommentData.content.substring(0, 50) + (parentCommentData.content.length > 50 ? '...' : '')
                : 'your comment';

                await createNotification({
                  recipientUserId: parentCommentAuthorId,
                  type: 'reply',
                  fromUserId: userId,
                  fromUsername: userChannel || '@unknown',
                  fromProfilePic: null,
                  relatedCanvasId: post.id,
                  relatedCanvasTitle: null,  // ← Changed to null
                  relatedCommentId: replyingTo.id,
                  commentText: commentPreview,
                });

              console.log('✅ Reply notification sent to:', parentCommentAuthorId);
            }
          }
        } catch (replyNotifError) {
          console.error('Reply notification error:', replyNotifError);
        }
      }

      const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', post.id);
      await updateDoc(postRef, {
        commentsCount: increment(1),
      });

      // CREATE NOTIFICATION FOR COMMENT
      if (post.userId && post.userId !== userId) {
        try {
          const { createNotification } = await import('../utils/notifications');

          await createNotification({
            recipientUserId: post.userId,
            type: 'comment',
            fromUserId: userId,
            fromUsername: userChannel || '@unknown',
            fromProfilePic: null,
            relatedCanvasId: post.id,
            relatedCanvasTitle: null,  // ← Changed from 'your post' to null
          });
        } catch (notifError) {
          console.error('Notification creation failed:', notifError);
        }
      }

      // CREATE NOTIFICATIONS FOR MENTIONED USERS
      const mentions = extractMentions(newComment);
      if (mentions.length > 0) {
        console.log('📢 Found mentions:', mentions);
        
        try {
          const { createNotification } = await import('../utils/notifications');
          
          for (const mentionedUsername of mentions) {
            const mentionedUserId = await getUserIdFromChannel(mentionedUsername);
            
            if (mentionedUserId && mentionedUserId !== userId) {
              console.log('📢 Sending mention notification to:', mentionedUserId);
              
              await createNotification({
                recipientUserId: mentionedUserId,
                type: 'mention',
                fromUserId: userId,
                fromUsername: userChannel || '@unknown',
                fromProfilePic: null,
                relatedCanvasId: post.id,
                relatedCanvasTitle: null,  // ← Changed to null
              });
            }
          }
        } catch (mentionError) {
          console.error('Mention notification error:', mentionError);
        }
      }

      setNewComment('');
      setVoiceUrl(null);
      setVoiceDuration(null);
      setReplyingTo(null);
    } catch (error) {
      console.error('Comment submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentReact = async (commentId: string, reactionType: ReactionType) => {
    if (!userId) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const commentRef = doc(
        firestore,
        'artifacts',
        APP_ID,
        'public',
        'data',
        'posts',
        post.id,
        'comments',
        commentId
      );

      const commentDoc = await getDoc(commentRef);
      if (!commentDoc.exists()) return;

      const commentData = commentDoc.data();
      const currentReactions = commentData.reactions || {
        heart: [],
        fire: [],
        laugh: [],
        clap: [],
        heart_eyes: [],
        sparkles: [],
      };

      const hasReacted = currentReactions[reactionType]?.includes(userId);

      // Toggle reaction
      if (hasReacted) {
        // Remove reaction
        currentReactions[reactionType] = currentReactions[reactionType].filter(
          (id: string) => id !== userId
        );
      } else {
        // Add reaction
        if (!currentReactions[reactionType]) {
          currentReactions[reactionType] = [];
        }
        currentReactions[reactionType].push(userId);
      }

      // Calculate counts
      const reactionCounts = {
        heart: currentReactions.heart?.length || 0,
        fire: currentReactions.fire?.length || 0,
        laugh: currentReactions.laugh?.length || 0,
        clap: currentReactions.clap?.length || 0,
        heart_eyes: currentReactions.heart_eyes?.length || 0,
        sparkles: currentReactions.sparkles?.length || 0,
      };

      await updateDoc(commentRef, {
        reactions: currentReactions,
        reactionCounts: reactionCounts,
      });

      console.log(`✅ ${hasReacted ? 'Removed' : 'Added'} ${reactionType} reaction`);
    } catch (error) {
      console.error('Reaction error:', error);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Focus the input to open keyboard
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleViewReplies = async (commentId: string) => {
    const isExpanded = expandedReplies.has(commentId);

    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedReplies);
      newExpanded.delete(commentId);
      setExpandedReplies(newExpanded);
    } else {
      // Expand - fetch replies
      try {
        const repliesRef = collection(
          firestore,
          'artifacts',
          APP_ID,
          'public',
          'data',
          'posts',
          post.id,
          'comments'
        );

        const q = query(
          repliesRef,
          where('parentCommentId', '==', commentId)
        );

        const snapshot = await getDocs(q);
        const repliesData: Comment[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];

        // Sort by oldest first (replies chronological)
        repliesData.sort(
          (a, b) =>
            (a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0) -
            (b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0),
        );

        setReplies((prev) => ({ ...prev, [commentId]: repliesData }));

        const newExpanded = new Set(expandedReplies);
        newExpanded.add(commentId);
        setExpandedReplies(newExpanded);

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.error('Fetch replies error:', error);
      }
    }
  };

  const handleCommentLike = async (commentId: string, likedBy: string[] = []) => {
    if (!userId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isLiked = likedBy.includes(userId);
    const commentRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'posts',
      post.id,
      'comments',
      commentId
    );

    try {
      await updateDoc(commentRef, {
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (error) {
      console.error('Comment like error:', error);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const profile = allProfiles[item.userId];
    const displayChannel = profile?.channel || item.userChannel;
    const profilePic = profile?.profilePictureUrl;
    const initials = displayChannel.replace('@', '').substring(0, 2).toUpperCase();

    const timestamp = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp?.seconds * 1000 || Date.now());
    const timeString = timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.commentAvatar} />
          ) : (
            <LinearGradient
              colors={getGradientForChannel(displayChannel)}
              style={styles.commentAvatar}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={styles.commentMeta}>
            <Text style={styles.commentChannel}>{displayChannel}</Text>
            <Text style={styles.commentTime}>{timeString}</Text>
          </View>
        </View>

        {item.voiceUrl && (
          <View style={{ paddingLeft: 42, marginTop: 8 }}>
            <VoiceCommentPlayer
              audioUrl={item.voiceUrl}
              duration={item.voiceDuration || 0}
            />
          </View>
        )}
        {item.content && item.content.trim() && (
          <ClickableText 
            text={item.content} 
            style={styles.commentContent}
            onMentionPress={navigateToUserProfile}
          />
        )}

        {/* Actions Row (Reply + React buttons) */}
        <View style={styles.commentActions}>
          {/* Reply Button */}
          <TouchableOpacity
            onPress={() => handleReply(item.id, item.userChannel)}
            style={styles.actionButton}
          >
            <Ionicons name="chatbubble-outline" size={16} color={COLORS.cyan400} />
            <Text style={styles.actionText}>Reply</Text>
            {item.replyCount && item.replyCount > 0 && (
              <Text style={styles.actionCount}>({item.replyCount})</Text>
            )}
          </TouchableOpacity>

          {/* Total Reactions Count */}
          {item.reactionCounts && Object.values(item.reactionCounts).reduce((a, b) => a + b, 0) > 0 && (
            <TouchableOpacity
              onPress={() => {
                const newExpanded = new Set(expandedReactions);
                if (expandedReactions.has(item.id)) {
                  newExpanded.delete(item.id);
                } else {
                  newExpanded.add(item.id);
                }
                setExpandedReactions(newExpanded);
              }}
              style={styles.actionButton}
            >
              <Ionicons name="happy-outline" size={16} color={COLORS.purple400} />
              <Text style={styles.actionText}>
                {Object.values(item.reactionCounts).reduce((a, b) => a + b, 0)}
              </Text>
            </TouchableOpacity>
          )}

          {/* React Button */}
          <TouchableOpacity
            onPress={() => {
              const newExpanded = new Set(expandedReactions);
              if (expandedReactions.has(item.id)) {
                newExpanded.delete(item.id);
              } else {
                newExpanded.add(item.id);
              }
              setExpandedReactions(newExpanded);
            }}
            style={styles.actionButton}
          >
            <Ionicons
              name={expandedReactions.has(item.id) ? "close-circle-outline" : "add-circle-outline"}
              size={16}
              color={COLORS.purple400}
            />
            <Text style={styles.actionText}>
              {expandedReactions.has(item.id) ? 'Close' : 'React'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reaction Buttons (Expandable) */}
        {expandedReactions.has(item.id) && (
          <View style={styles.reactionsRow}>
            {(['heart', 'fire', 'laugh', 'clap', 'heart_eyes', 'sparkles'] as ReactionType[]).map((type) => {
              const emoji = {
                heart: '❤️',
                fire: '🔥',
                laugh: '😂',
                clap: '👏',
                heart_eyes: '😍',
                sparkles: '✨',
              }[type];

              const count = item.reactionCounts?.[type] || 0;
              const hasReacted = item.reactions?.[type]?.includes(userId || '');

              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleCommentReact(item.id, type)}
                  style={[
                    styles.reactionButton,
                    hasReacted && styles.reactionButtonActive,
                  ]}
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
        {item.replyCount && item.replyCount > 0 && (
          <TouchableOpacity
            onPress={() => handleViewReplies(item.id)}
            style={styles.viewRepliesButton}
          >
            <Ionicons
              name="return-down-forward"
              size={14}
              color={COLORS.cyan400}
            />
            <Text style={styles.viewRepliesText}>
              {expandedReplies.has(item.id) ? 'Hide' : 'View'} {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Render Replies (if expanded) */}
        {expandedReplies.has(item.id) && replies[item.id] && replies[item.id].length > 0 && (
          <View style={styles.repliesContainer}>
            {replies[item.id].map((reply) => {
              // Skip invalid replies (defensive check)
              if (!reply || (!reply.content && !reply.voiceUrl)) {
                return null;
              }

              const replyProfile = allProfiles[reply.userId];
              const replyDisplayChannel = replyProfile?.channel || reply.userChannel;
              const replyProfilePic = replyProfile?.profilePictureUrl;
              const replyInitials = replyDisplayChannel.replace('@', '').substring(0, 2).toUpperCase();

              const replyTimestamp = reply.timestamp?.toDate ? reply.timestamp.toDate() : new Date(reply.timestamp?.seconds * 1000 || Date.now());
              const replyTimeString = replyTimestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View key={reply.id} style={styles.replyItem}>
                  <View style={styles.replyLine} />
                  <View style={styles.replyContent}>
                    <View style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        {replyProfilePic ? (
                          <Image source={{ uri: replyProfilePic }} style={styles.commentAvatar} />
                        ) : (
                          <LinearGradient
                            colors={getGradientForChannel(replyDisplayChannel)}
                            style={styles.commentAvatar}
                          >
                            <Text style={styles.avatarInitials}>{replyInitials}</Text>
                          </LinearGradient>
                        )}
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentChannel}>{replyDisplayChannel}</Text>
                          <Text style={styles.commentTime}>{replyTimeString}</Text>
                        </View>
                      </View>

                      {reply.voiceUrl && (
                        <View style={{ paddingLeft: 42, marginTop: 8 }}>
                          <VoiceCommentPlayer
                            audioUrl={reply.voiceUrl}
                            duration={reply.voiceDuration || 0}
                          />
                        </View>
                      )}
                      {reply.content && reply.content.trim() && (
                        <ClickableText 
                          text={reply.content} 
                          style={styles.commentContent}
                          onMentionPress={navigateToUserProfile}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.slate900, COLORS.slate800]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="chevron-down" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="chatbubble-outline" size={48} color={COLORS.slate600} />
              <Text style={styles.emptyText}>No comments yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.inputContainer}>
          <MentionDropdown
            visible={mentionSystem.showMentionDropdown}
            users={mentionSystem.mentionResults}
            onSelectUser={(user) => mentionSystem.handleSelectMention(user, newComment, setNewComment)}
          />

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

          {!isRecording && voiceUrl && (
            <View style={styles.voicePreview}>
              <VoiceCommentPlayer audioUrl={voiceUrl} duration={voiceDuration || 0} />
              <TouchableOpacity
                onPress={() => {
                  setVoiceUrl(null);
                  setVoiceDuration(null);
                }}
                style={styles.removeVoiceButton}
              >
                <Text style={styles.removeVoiceText}>Remove Voice</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            {!voiceUrl && (
              <VoiceRecorder
                onRecordingComplete={(uri, duration) => {
                  setVoiceUrl(uri);
                  setVoiceDuration(duration);
                  setIsRecording(false);
                }}
                onCancel={() => {
                  setIsRecording(false);
                }}
              />
            )}

            <TextInput
              ref={inputRef}
              style={styles.input}
              value={newComment}
              onChangeText={(text) => mentionSystem.handleTextChange(text, setNewComment)}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.slate500}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={(!newComment.trim() && !voiceUrl) || isSubmitting}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={(newComment.trim() || voiceUrl) && !isSubmitting ? GRADIENTS.primary : [COLORS.slate700, COLORS.slate700] as const}
                style={styles.sendGradient}
              >
                <Icon name="send" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60, // Raised from 48 to 60
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  commentCard: {
    backgroundColor: COLORS.slate800,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  commentMeta: {
    flex: 1,
  },
  commentChannel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cyan400,
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  commentContent: {
    fontSize: 14,
    color: COLORS.gray200,
    lineHeight: 20,
    paddingLeft: 42,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate400,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'column',  // ← Changed from 'row' to 'column'
    backgroundColor: COLORS.slate800,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
    paddingBottom: 60,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.white,
    maxHeight: 100,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  sendButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  commentLikeCount: {
    fontSize: 12,
    color: COLORS.slate400,
    fontWeight: '600',
  },
  voicePreview: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  removeVoiceButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  removeVoiceText: {
    color: COLORS.red400,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,  // ← Increased from 20 to 40
    paddingVertical: 12,
    gap: 0,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingLeft: 42,
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
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingLeft: 42,
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
  actionCount: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    paddingLeft: 42,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
  },
  viewRepliesText: {
    fontSize: 13,
    color: COLORS.cyan400,
    fontWeight: '500',
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
  replyContent: {
    flex: 1,
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
});

export default CommentsScreen;