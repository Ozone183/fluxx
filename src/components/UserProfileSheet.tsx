import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator } from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';

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
      const userDoc = await getDoc(doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'users', userId));
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
      const userRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'users', userId);

      if (isFollowing) {
        await updateDoc(userRef, { followers: arrayRemove(currentUserId) });
        setIsFollowing(false);
      } else {
        await updateDoc(userRef, { followers: arrayUnion(currentUserId) });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow error:', error);
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
                <Text style={styles.username}>{profile?.username || '@unknown'}</Text>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{profile?.followers?.length || 0}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
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
