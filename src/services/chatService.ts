import { ref, push, onValue, off, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database';
import { realtimeDb } from '../config/firebase';

export interface ChatMessage {
  id: string;
  partyId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type?: 'message' | 'reaction';
}

// Send a chat message
export const sendChatMessage = async (
  partyId: string,
  userId: string,
  username: string,
  message: string
): Promise<void> => {
  try {
    const messagesRef = ref(realtimeDb, `watchParties/${partyId}/chat`);
    await push(messagesRef, {
      userId,
      username,
      message,
      timestamp: serverTimestamp(),
      type: 'message',
    });
    console.log('💬 Message sent:', message);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Subscribe to chat messages
export const subscribeToChatMessages = (
  partyId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesRef = ref(realtimeDb, `watchParties/${partyId}/chat`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(50));

  onValue(messagesQuery, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const messages: ChatMessage[] = Object.entries(data).map(([id, msg]: [string, any]) => ({
        id,
        partyId,
        userId: msg.userId,
        username: msg.username,
        message: msg.message,
        timestamp: msg.timestamp,
        type: msg.type || 'message',
      }));
      callback(messages);
    } else {
      callback([]);
    }
  });

  return () => off(messagesQuery);
};

// Send a reaction (emoji)
export const sendReaction = async (
  partyId: string,
  userId: string,
  username: string,
  emoji: string
): Promise<void> => {
  try {
    const messagesRef = ref(realtimeDb, `watchParties/${partyId}/chat`);
    await push(messagesRef, {
      userId,
      username,
      message: emoji,
      timestamp: serverTimestamp(),
      type: 'reaction',
    });
  } catch (error) {
    console.error('Error sending reaction:', error);
  }
};
