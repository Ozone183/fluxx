// src/components/CollaboratorsBar.tsx

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { ActivePresence } from '../types/canvas';

interface CollaboratorsBarProps {
  collaborators: ActivePresence[];
  maxShow?: number;
}

const CollaboratorsBar: React.FC<CollaboratorsBarProps> = ({
  collaborators,
  maxShow = 5,
}) => {
  if (collaborators.length === 0) return null;

  const visibleCollaborators = collaborators.slice(0, maxShow);
  const remainingCount = collaborators.length - maxShow;

  return (
    <View style={styles.container}>
      <View style={styles.avatarsContainer}>
        {visibleCollaborators.map((collab, index) => (
          <View
            key={collab.userId}
            style={[styles.avatarWrapper, { marginLeft: index > 0 ? -12 : 0 }]}
          >
            {collab.profilePicUrl ? (
              <Image
                source={{ uri: collab.profilePicUrl }}
                style={styles.avatar}
              />
            ) : (
              <LinearGradient
                colors={getGradientForUser(collab.username)}
                style={styles.avatar}
              >
                <Text style={styles.avatarInitials}>
                  {getInitials(collab.username)}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.activeIndicator} />
          </View>
        ))}

        {remainingCount > 0 && (
          <View style={[styles.avatarWrapper, { marginLeft: -12 }]}>
            <View style={[styles.avatar, styles.moreAvatar]}>
              <Text style={styles.moreText}>+{remainingCount}</Text>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.text}>
        {collaborators.length === 1
          ? '1 person editing'
          : `${collaborators.length} people editing`}
      </Text>
    </View>
  );
};

const getInitials = (username: string): string => {
  return username.replace('@', '').substring(0, 2).toUpperCase();
};

const getGradientForUser = (username: string): readonly [string, string] => {
  const colors = [
    [COLORS.indigo600, COLORS.pink600] as const,
    [COLORS.cyan500, COLORS.indigo600] as const,
    [COLORS.teal500, COLORS.green600] as const,
    [COLORS.purple600, COLORS.pink600] as const,
  ];
  return colors[(username?.length || 0) % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.slate800,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate700,
  },
  avatarsContainer: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.slate800,
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green500,
    borderWidth: 2,
    borderColor: COLORS.slate800,
  },
  moreAvatar: {
    backgroundColor: COLORS.slate700,
  },
  moreText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate300,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cyan400,
  },
});

export default CollaboratorsBar;
