import { realtimeDb as database } from '../config/firebase';
import {
  ref,
  push,
  set,
  update,
  onValue,
  query,
  orderByChild,
  limitToLast,
  get,
  off,
} from 'firebase/database';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
  type: 'text' | 'image' | 'video' | 'voice';
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: number;
  lastMessageSenderId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  isOnline: boolean;
  unreadCount: number;
}

export interface TypingStatus {
  [userId: string]: boolean;
}

class ChatService {
  /**
   * Get or create a chat between two users
   */
  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    // Create a consistent chat ID regardless of user order
    const chatId = [userId1, userId2].sort().join('_');
    const chatRef = ref(database, `chats/${chatId}`);
    
    const snapshot = await get(chatRef);
    
    if (!snapshot.exists()) {
      // Create new chat
      const chatData = {
        participants: [userId1, userId2],
        createdAt: Date.now(),
        lastMessage: '',
        lastMessageTime: Date.now(),
        lastMessageSenderId: '',
      };
      
      console.log('Creating chat with data:', chatData);
      await set(chatRef, chatData);
      
      // Wait a moment for Firebase to process
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return chatId;
  }

  /**
   * Send a text message
   */
  async sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
    const messagesRef = ref(database, `messages/${chatId}`);
    const newMessageRef = push(messagesRef);
    
    const message: Omit<Message, 'id'> = {
      chatId,
      senderId,
      text,
      timestamp: Date.now(),
      read: false,
      type: 'text',
    };

    await set(newMessageRef, message);

    // Update chat metadata
    const chatRef = ref(database, `chats/${chatId}`);
    await update(chatRef, {
      lastMessage: text,
      lastMessageTime: message.timestamp,
      lastMessageSenderId: senderId,
    });

    // Update unread count for other user
    const chatSnapshot = await get(chatRef);
    if (chatSnapshot.exists()) {
      const participants = chatSnapshot.val().participants as string[];
      const otherUserId = participants.find(id => id !== senderId);
      
      if (otherUserId) {
        const unreadRef = ref(database, `userChats/${otherUserId}/${chatId}/unreadCount`);
        const unreadSnapshot = await get(unreadRef);
        const currentUnread = unreadSnapshot.val() || 0;
        await set(unreadRef, currentUnread + 1);
      }
    }
  }

  /**
   * Subscribe to messages in a chat
   */
  subscribeToMessages(
    chatId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesRef = query(
      ref(database, `messages/${chatId}`),
      orderByChild('timestamp'),
      limitToLast(100)
    );

    const listener = onValue(messagesRef, (snapshot) => {
      const messages: Message[] = [];
      
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      // Sort messages by timestamp (newest first for FlatList inverted)
      messages.sort((a, b) => b.timestamp - a.timestamp);
      
      callback(messages);
    });

    // Return unsubscribe function
    return () => off(messagesRef);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    const messagesRef = ref(database, `messages/${chatId}`);
    const snapshot = await get(messagesRef);
    
    if (snapshot.exists()) {
      const updates: { [key: string]: boolean } = {};
      
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        if (message.senderId !== userId && !message.read) {
          updates[`messages/${chatId}/${childSnapshot.key}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }
    }

    // Reset unread count
    const unreadRef = ref(database, `userChats/${userId}/${chatId}/unreadCount`);
    await set(unreadRef, 0);
  }

  /**
   * Set typing status
   */
  async setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(database, `typing/${chatId}/${userId}`);
    await set(typingRef, isTyping);
  }

  /**
   * Subscribe to typing status
   */
  subscribeToTypingStatus(
    chatId: string,
    otherUserId: string,
    callback: (isTyping: boolean) => void
  ): () => void {
    const typingRef = ref(database, `typing/${chatId}/${otherUserId}`);
    
    const listener = onValue(typingRef, (snapshot) => {
      callback(snapshot.val() || false);
    });

    return () => off(typingRef);
  }

  /**
   * Get user's chats
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    const chatsRef = ref(database, 'chats');
    const snapshot = await get(chatsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const chats: Chat[] = [];
    
    for (const [chatId, chatData] of Object.entries(snapshot.val())) {
      const chat = chatData as any;
      
      if (chat.participants?.includes(userId)) {
        const otherUserId = chat.participants.find((id: string) => id !== userId);
        
        if (otherUserId) {
          // Get other user's info (you'll need to implement getUserInfo)
          const otherUserInfo = await this.getUserInfo(otherUserId);
          
          // Get unread count
          const unreadRef = ref(database, `userChats/${userId}/${chatId}/unreadCount`);
          const unreadSnapshot = await get(unreadRef);
          const unreadCount = unreadSnapshot.val() || 0;
          
          chats.push({
            id: chatId,
            participants: chat.participants,
            lastMessage: chat.lastMessage || 'No messages yet',
            lastMessageTime: chat.lastMessageTime || chat.createdAt,
            lastMessageSenderId: chat.lastMessageSenderId || '',
            otherUserId,
            otherUserName: otherUserInfo.name || 'Unknown User',
            otherUserAvatar: otherUserInfo.avatar || '',
            isOnline: false, // Real online status will be added later
            unreadCount,
          });
        }
      }
    }

    // Sort by last message time
    chats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
    return chats;
  }

  /**
   * Get user info (mock implementation - replace with your actual user service)
   */
  private async getUserInfo(userId: string): Promise<{
    name: string;
    avatar: string;
    isOnline: boolean;
  }> {
    try {
      const { firestore } = await import('../config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      const { APP_ID } = await import('../context/AuthContext');
      
      const profileDocRef = doc(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles', userId);
      const profileDoc = await getDoc(profileDocRef);
      
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return {
          name: data.channel || 'User',
          avatar: data.profilePictureUrl || '',
          isOnline: false,
        };
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
    
    return {
      name: 'User',
      avatar: '',
      isOnline: false,
    };
  }

  /**
   * Update user's online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const userRef = ref(database, `users/${userId}/isOnline`);
    await set(userRef, isOnline);
    
    if (isOnline) {
      const lastSeenRef = ref(database, `users/${userId}/lastSeen`);
      await set(lastSeenRef, Date.now());
    }
  }

  /**
   * Subscribe to user's online status
   */
  subscribeToOnlineStatus(
    userId: string,
    callback: (isOnline: boolean) => void
  ): () => void {
    const statusRef = ref(database, `users/${userId}/isOnline`);
    
    const listener = onValue(statusRef, (snapshot) => {
      callback(snapshot.val() || false);
    });

    return () => off(statusRef);
  }
}

export const chatService = new ChatService();
export const dmService = chatService; // Export as dmService for DMs
