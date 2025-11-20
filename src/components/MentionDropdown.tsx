import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

interface MentionUser {
  id: string;
  channel: string;
  displayName: string;
  profilePictureUrl?: string;
}

interface MentionDropdownProps {
  visible: boolean;
  users: MentionUser[];
  onSelectUser: (user: MentionUser) => void;
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({
  visible,
  users,
  onSelectUser,
}) => {
  if (!visible || users.length === 0) {
    return null;
  }

  const getGradientForChannel = (channel: string): readonly [string, string] => {
    const colors = [
      [COLORS.indigo600, COLORS.pink600] as const,
      [COLORS.cyan500, COLORS.indigo600] as const,
      [COLORS.teal500, COLORS.green600] as const,
    ];
    return colors[(channel?.length || 0) % colors.length];
  };

  const renderUser = ({ item }: { item: MentionUser }) => {
    const initials = item.channel.replace('@', '').substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => onSelectUser(item)}
        activeOpacity={0.7}
      >
        {item.profilePictureUrl ? (
          <Image source={{ uri: item.profilePictureUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={getGradientForChannel(item.channel)}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.channel}>{item.channel}</Text>
          {item.displayName && (
            <Text style={styles.displayName}>{item.displayName}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    maxHeight: 200,
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cyan400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  list: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  channel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
  displayName: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 2,
  },
});

export default MentionDropdown;
