import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

interface Member {
  userId: string;
  username: string;
}

interface PrivateCanvasMembersModalProps {
  visible: boolean;
  canvasId: string;
  allowedUsers: string[];
  onClose: () => void;
}

const PrivateCanvasMembersModal: React.FC<PrivateCanvasMembersModalProps> = ({
  visible,
  canvasId,
  allowedUsers,
  onClose,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadMembers();
    }
  }, [visible, allowedUsers]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const memberData: Member[] = [];

      for (const userId of allowedUsers) {
        const profileRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data();
          memberData.push({
            userId,
            username: profile.channel || '@unknown',
          });
        }
      }

      setMembers(memberData);
    } catch (error) {
      console.error('Load members error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberIcon}>
        <Icon name="person" size={20} color={COLORS.cyan400} />
      </View>
      <Text style={styles.memberName}>{item.username}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Members ({allowedUsers.length})</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.cyan400} />
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={renderMember}
              keyExtractor={item => item.userId}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="people-outline" size={48} color={COLORS.slate600} />
                  <Text style={styles.emptyText}>No members yet</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.slate800,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate700,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.slate400,
    marginTop: 12,
  },
});

export default PrivateCanvasMembersModal;
