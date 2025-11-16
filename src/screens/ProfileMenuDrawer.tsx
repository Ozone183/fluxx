// src/screens/ProfileMenuDrawer.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const ProfileMenuDrawer = () => {
  const navigation = useNavigation();
  const { userId, userChannel, logout } = useAuth();

  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View and edit your profile',
      icon: 'person-outline',
      color: COLORS.cyan400,
      onPress: () => {
        navigation.navigate('Profile' as never);
      },
    },
    {
      id: 'search',
      title: 'Search Users',
      subtitle: 'Find friends and creators',
      icon: 'search-outline',
      color: COLORS.purple400,
      onPress: () => {
        navigation.navigate('Search' as never);
      },
    },
    {
      id: 'saved',
      title: 'Saved Canvases',
      subtitle: 'Your bookmarked creations',
      icon: 'bookmark-outline',
      color: COLORS.amber400,
      onPress: () => {
        // TODO: Navigate to saved canvases screen
        Alert.alert('Coming Soon', 'Saved canvases feature is coming soon!');
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Privacy, security, and preferences',
      icon: 'settings-outline',
      color: COLORS.slate400,
      onPress: () => {
        navigation.navigate('Settings' as never);
      },
    },
    {
      id: 'premium',
      title: 'Fluxx Premium',
      subtitle: 'Unlock exclusive features',
      icon: 'diamond-outline',
      color: COLORS.amber400,
      badge: 'NEW',
      onPress: () => {
        // TODO: Navigate to premium screen
        Alert.alert('Coming Soon', 'Premium membership is coming soon!');
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and send feedback',
      icon: 'help-circle-outline',
      color: COLORS.green600,
      onPress: () => {
        // TODO: Navigate to help screen or open support
        Alert.alert('Help & Support', 'Contact us at support@fluxx.app');
      },
    },
    {
      id: 'about',
      title: 'About Fluxx',
      subtitle: 'Version info and legal',
      icon: 'information-circle-outline',
      color: COLORS.slate400,
      onPress: () => {
        Alert.alert(
          'About Fluxx',
          'Fluxx v1.0.0\nCollaborative Canvas Platform\n\nMade with ❤️ for creators worldwide.'
        );
      },
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMenuItem = (item: typeof menuItems[0]) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <View style={styles.menuItemText}>
          <View style={styles.titleRow}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.slate500} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userChannel ? userChannel.charAt(1).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.username}>
              {userChannel || '@user'}
            </Text>
            <TouchableOpacity
              style={styles.viewProfileButton}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.cyan400} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.logoutLeft}>
              <View style={[styles.iconContainer, { backgroundColor: `${COLORS.red400}20` }]}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.red400} />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.slate500} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Fluxx • Collaborative Canvas Platform
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.slate800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cyan500,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileText: {
    fontSize: 14,
    color: COLORS.cyan400,
    fontWeight: '600',
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  badge: {
    backgroundColor: COLORS.amber400,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate800,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red400,
  },
  footer: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.slate500,
    textAlign: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.slate600,
    textAlign: 'center',
  },
});

export default ProfileMenuDrawer;
