import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../services/dmService';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
  otherUserName: string;
}

export default function MessageBubble({
  message,
  isCurrentUser,
  showAvatar,
  otherUserName,
}: MessageBubbleProps) {
  const slideAnim = useRef(new Animated.Value(isCurrentUser ? 50 : -50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
        {
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Avatar for other user */}
      {!isCurrentUser && (
        <View style={styles.avatarContainer}>
          {showAvatar ? (
            <LinearGradient
              colors={['#3b82f6', '#06b6d4']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {otherUserName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
      )}

      {/* Message Bubble */}
      <View style={styles.bubbleContainer}>
        {isCurrentUser ? (
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.bubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.timeText}>{formatTime(message.timestamp)}</Text>
              {message.read && (
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                  style={styles.readIcon}
                />
              )}
            </View>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#3b82f6', '#06b6d4']}
            style={styles.bubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.timeText}>{formatTime(message.timestamp)}</Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Spacer for current user */}
      {isCurrentUser && <View style={styles.avatarPlaceholder} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarPlaceholder: {
    width: 32,
  },
  bubbleContainer: {
    maxWidth: '70%',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  readIcon: {
    marginLeft: 4,
  },
});
