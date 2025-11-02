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
import { collection, onSnapshot, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';



interface Comment {
  id: string;
  userId: string;
  userChannel: string;
  content: string;
  timestamp: any;
}

const CommentsScreen = ({ route, navigation }: any) => {
  const { post } = route.params;
  const { userId, userChannel } = useAuth();
  const { allProfiles } = useProfiles();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const commentsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', post.id, 'comments');
    
    const unsubscribe = onSnapshot(
      commentsRef,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];

        // Sort oldest first
        fetchedComments.sort(
          (a, b) =>
            (a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0) - 
            (b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0),
        );

        setComments(fetchedComments);
      },
      (error) => {
        console.error('Comments snapshot error:', error);
      },
    );

    return () => unsubscribe();
  }, [post.id]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !userId || !userChannel) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const commentsRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', post.id, 'comments');

      await addDoc(commentsRef, {
        userId,
        userChannel,
        content: newComment.trim(),
        timestamp: serverTimestamp(),
      });

      // Update comments count
      const postRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'posts', post.id);

      await updateDoc(postRef, {
        commentsCount: increment(1),
      });

      setNewComment('');
    } catch (error) {
      console.error('Comment submit error:', error);
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.commentContent}>{item.content}</Text>
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

      {/* Comments List */}
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="message-circle" size={48} color={COLORS.slate600} />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share your thoughts!</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
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
            disabled={!newComment.trim() || isSubmitting}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={newComment.trim() && !isSubmitting ? GRADIENTS.primary : [COLORS.slate700, COLORS.slate700]}
              style={styles.sendGradient}
            >
              <Icon name="send" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 48,
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: COLORS.slate800,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate700,
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
});

export default CommentsScreen;
