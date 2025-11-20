import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface ClickableTextProps {
  text: string;
  style?: any;
  onMentionPress: (username: string) => void;
}

const ClickableText: React.FC<ClickableTextProps> = ({ text, style, onMentionPress }) => {
  // Regex to detect @username (alphanumeric + underscore)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionStart = match.index;
    const mention = match[0]; // Full @username
    const username = match[1]; // Just username without @

    // Add text before mention
    if (mentionStart > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={style}>
          {text.substring(lastIndex, mentionStart)}
        </Text>
      );
    }

    // Add clickable mention
    parts.push(
      <Text
        key={`mention-${mentionStart}`}
        style={[style, styles.mention]}
        onPress={() => onMentionPress(username)}
      >
        {mention}
      </Text>
    );

    lastIndex = mentionStart + mention.length;
  }

  // Add remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={style}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return <>{parts}</>;
};

const styles = StyleSheet.create({
  mention: {
    color: COLORS.cyan400,
    fontWeight: '600',
  },
});

export default ClickableText;
