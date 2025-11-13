// src/screens/NotificationsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import { useAuth, APP_ID } from '../context/AuthContext';

interface Notification {
  id: string;
  type: string;
  fromUserId: string;
  fromUsername: string;
  fromProfilePic: string | null;
  message: string;
  relatedCanvasId?: string;
  timestamp: number;
  isRead: boolean;
  actionUrl: string;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
  
    const q = query(notificationsRef, orderBy('timestamp', 'desc'));
  
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
  
        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        // ✅ ERROR CALLBACK - Stops infinite loading
        console.error('Notifications error:', error);
        setNotifications([]);
        setLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    const notifRef = doc(
      firestore,
      'artifacts',
      APP_ID,
      'public',
      'data',
      'notifications',
      userId,
      'items',
      notificationId
    );

    await updateDoc(notifRef, { isRead: true });
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on action URL
    if (notification.actionUrl.includes('profile')) {
      const targetUserId = notification.fromUserId;
      (navigation as any).navigate('Profile', { userId: targetUserId });
    } else if (notification.actionUrl.includes('canvas')) {
      (navigation as any).navigate('CanvasEditor', { canvasId: notification.relatedCanvasId });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return 'person-add';
      case 'like':
        return 'heart';
      case 'canvas_invite':
        return 'mail';
      case 'comment':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow':
        return COLORS.cyan400;
      case 'like':
        return COLORS.red400;
      case 'canvas_invite':
        return COLORS.purple400;
      case 'comment':
        return COLORS.amber400;
      default:
        return COLORS.slate400;
    }
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.isRead && styles.notificationCardUnread
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {/* Profile Pic or Icon */}
        {item.fromProfilePic ? (
          <Image
            source={{ uri: item.fromProfilePic }}
            style={styles.profilePic}
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: `${getNotificationColor(item.type)}20` }]}>
            <Icon
              name={getNotificationIcon(item.type) as any}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
        )}

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.timestamp}>{getTimeAgo(item.timestamp)}</Text>
        </View>

        {/* Unread Indicator */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.cyan400} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off-outline" size={64} color={COLORS.slate600} />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              When someone follows you or likes your canvas, you'll see it here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  notificationCardUnread: {
    backgroundColor: COLORS.slate700,
    borderColor: COLORS.cyan400,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.cyan400,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

export default NotificationsScreen;
