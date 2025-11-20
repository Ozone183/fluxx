import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { APP_ID } from '../context/AuthContext';

interface MentionUser {
  id: string;
  channel: string;
  displayName: string;
  profilePictureUrl?: string;
}

export const useMentions = () => {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const searchMentionUsers = async (searchTerm: string) => {
    console.log('🔍 Searching for:', searchTerm);

    if (!searchTerm || searchTerm.length < 2) {
      console.log('🔍 Search term too short, clearing results');
      setMentionResults([]);
      return;
    }

    try {
      const usersRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles');
      const snapshot = await getDocs(usersRef);
      console.log('🔍 Total users in DB:', snapshot.size);

      const users: MentionUser[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        const channel = userData.channel || '';
        
        // Search by username (channel only, since displayName doesn't exist in profiles)
        if (channel.toLowerCase().includes(searchTerm.toLowerCase())) {
          users.push({
            id: doc.id,
            channel: userData.channel,
            displayName: userData.channel, // Use channel as displayName
            profilePictureUrl: userData.profilePictureUrl,
          });
        }
      });

      // Limit to 5 results
      console.log('🔍 Found matching users:', users.length, users);
      setMentionResults(users.slice(0, 5));
    } catch (error) {
      console.error('User search error:', error);
      setMentionResults([]);
    }
  };

  const handleTextChange = (text: string, setText: (text: string) => void) => {
    setText(text);

    console.log('🔍 Text changed:', text);

    // Detect @ mentions
    const lastAtIndex = text.lastIndexOf('@');
    console.log('🔍 Last @ index:', lastAtIndex);

    if (lastAtIndex !== -1) {
      const textAfterAt = text.substring(lastAtIndex + 1);
      console.log('🔍 Text after @:', textAfterAt);

      // Check if there's a space after @ (means mention ended)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        console.log('🔍 Setting dropdown visible!');
        setMentionSearchTerm(textAfterAt);
        setShowMentionDropdown(true);
        searchMentionUsers(textAfterAt);
      } else {
        console.log('🔍 Space found, hiding dropdown');
        setShowMentionDropdown(false);
      }
    } else {
      console.log('🔍 No @ found');
      setShowMentionDropdown(false);
    }
  };

  const handleSelectMention = (user: MentionUser, currentText: string, setText: (text: string) => void) => {
    // Find last @ position
    const lastAtIndex = currentText.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Replace from @ to cursor with @username
      const beforeAt = currentText.substring(0, lastAtIndex);
      const afterCursor = currentText.substring(lastAtIndex + mentionSearchTerm.length + 1);
      const newText = `${beforeAt}@${user.channel} ${afterCursor}`;

      setText(newText);
      setShowMentionDropdown(false);
      setMentionSearchTerm('');
    }
  };

  return {
    showMentionDropdown,
    mentionResults,
    handleTextChange,
    handleSelectMention,
    setCursorPosition,
  };
};
