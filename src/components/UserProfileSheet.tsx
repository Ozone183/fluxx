import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { updateDoc, arrayUnion, arrayRemove, getDoc, doc, increment } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';


interface UserProfileSheetProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
}

const UserProfileSheet: React.FC<UserProfileSheetProps> = ({ userId, visible, onClose }) => {
  const { userId: currentUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadProfile();
    }
  }, [visible, userId]);

  const loadProfile = async () => {
    try {
      const userDoc = await getDoc(doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile(data);
        setIsFollowing(data.followers?.includes(currentUserId) || false);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
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
        // Unfollow: Remove from BOTH sides
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
        console.log('✅ Unfollowed user');
      } else {
        // Follow: Add to BOTH sides
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

        // ✅ ADD THIS: Create follow notification
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
        console.log('✅ Followed user');
      }
    } catch (error) {
      console.error('❌ Follow error:', error);
      Alert.alert('Error', 'Could not update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {loading ? (
            <ActivityIndicator color={COLORS.cyan400} />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.username}>
                  @{profile?.channel || profile?.username || 'unknown'}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{profile?.followerCount || profile?.followers?.length || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{profile?.followingCount || profile?.following?.length || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{profile?.canvasesCreated || 0}</Text>
                  <Text style={styles.statLabel}>Canvases</Text>
                </View>
              </View>

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
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.slate800,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 100,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.slate400,
  },
  followButton: {
    backgroundColor: COLORS.cyan500,
    padding: 14,
    borderRadius: 12,
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
});

export default UserProfileSheet;
