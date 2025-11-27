// src/components/ChatPanel.tsx
// 💬 Chat Panel Component for Watch Parties
// 🔥 FINAL FIX: Close button working, no touch blocking

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  sendChatMessage,
  sendReaction,
  subscribeToChatMessages,
  ChatMessage,
} from '../services/chatService';

interface ChatPanelProps {
  partyId: string;
  userId: string;
  username: string;
  isVisible: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  partyId,
  userId,
  username,
  isVisible,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(500)).current;

  // Subscribe to chat messages
  useEffect(() => {
    if (!partyId) return;

    console.log('💬 Subscribing to chat messages:', partyId);
    const unsubscribe = subscribeToChatMessages(partyId, (chatMessages) => {
      console.log('📨 Chat messages received:', chatMessages.length);
      setMessages(chatMessages);

      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [partyId]);

  // Animate panel in/out
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isVisible ? 0 : 500,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isVisible]);

  // Send text message
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);
      await sendChatMessage(partyId, userId, username, inputText.trim());
      setInputText('');
      Keyboard.dismiss();
      console.log('✅ Message sent:', inputText);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Send emoji reaction
  const handleSendReaction = async (emoji: string) => {
    try {
      await sendReaction(partyId, userId, username, emoji);
      console.log('✅ Reaction sent:', emoji);
    } catch (error) {
      console.error('❌ Failed to send reaction:', error);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.keyboardView} pointerEvents="auto">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="chatbubbles" size={20} color={COLORS.cyan400} />
            <Text style={styles.headerTitle}>
              Chat ({messages.length})
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('🔽 Close button tapped!');
              onClose();
            }}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Icon name="chevron-down" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="chatbubble-outline" size={48} color={COLORS.slate600} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Be the first to say something!</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.userId === userId;
              const isReaction = message.type === 'reaction';

              if (isReaction) {
                return (
                  <View key={message.id} style={styles.reactionContainer}>
                    <Text style={styles.reactionEmoji}>{message.message}</Text>
                    <Text style={styles.reactionUsername}>@{message.username}</Text>
                  </View>
                );
              }

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                  ]}
                >
                  {!isOwnMessage && (
                    <Text style={styles.messageUsername}>@{message.username}</Text>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isOwnMessage ? styles.ownBubble : styles.otherBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isOwnMessage ? styles.ownText : styles.otherText,
                      ]}
                    >
                      {message.message}
                    </Text>
                  </View>
                  <Text style={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Quick Reactions */}
        <View style={styles.reactionsBar}>
          {['❤️', '😂', '👍', '🔥', '😮', '😢'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleSendReaction(emoji)}
              style={styles.reactionButton}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionButtonEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Box */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.slate500}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            <Icon
              name="send"
              size={20}
              color={inputText.trim() && !sending ? COLORS.white : COLORS.slate600}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.cyan400,
    shadowColor: COLORS.cyan400,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 1000,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.slate900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
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
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate600,
    marginTop: 4,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.cyan400,
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: COLORS.cyan500,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.slate800,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: COLORS.white,
  },
  otherText: {
    color: COLORS.white,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 4,
  },
  reactionContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.slate800,
    borderRadius: 20,
    opacity: 0.9,
  },
  reactionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  reactionUsername: {
    fontSize: 11,
    color: COLORS.cyan400,
    fontWeight: '600',
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
    backgroundColor: COLORS.slate900,
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionButtonEmoji: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 250,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
    backgroundColor: COLORS.slate900,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.slate800,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: COLORS.white,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cyan500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.slate700,
  },
});

export default ChatPanel;
