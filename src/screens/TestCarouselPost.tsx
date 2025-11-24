import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import PostCard from '../components/PostCard';

/**
 * Test Component for Carousel Posts
 * 
 * Use this to test the ImageCarouselViewer without creating posts
 * 
 * Usage:
 * 1. Import in your test screen
 * 2. Replace image URLs with your own test images
 * 3. Replace music URL with a real MP3 file
 */

const TestCarouselPost: React.FC = () => {
  // Mock profile that matches your Profile interface
  const mockProfile = {
    userId: 'test-user',
    channel: '@TestUser',
    profilePictureUrl: 'https://i.pravatar.cc/150?img=12',
  };

  // Sample carousel post with 3 images
  const sampleCarouselPost = {
    id: 'test-carousel-1',
    userId: 'test-user-1',
    userChannel: '@TestUser',
    type: 'carousel' as const,
    images: [
      'https://picsum.photos/id/1018/1080/1080', // Nature
      'https://picsum.photos/id/1015/1080/1080', // River
      'https://picsum.photos/id/1019/1080/1080', // Mountains
    ],
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    musicTitle: 'Summer Vibes',
    content: 'Beautiful mountain adventure! 🏔️✨ Swipe to see more amazing views.',
    timestamp: new Date(),
    likedBy: [],
    commentsCount: 8,
    reactions: {},
    reactionCounts: {},
    coverImageIndex: 0,
  };

  // Sample carousel with maximum images (10)
  const maxImagesPost = {
    id: 'test-carousel-2',
    userId: 'test-user-2',
    userChannel: '@MaxTester',
    type: 'carousel' as const,
    images: [
      'https://picsum.photos/id/10/1080/1080',
      'https://picsum.photos/id/20/1080/1080',
      'https://picsum.photos/id/30/1080/1080',
      'https://picsum.photos/id/40/1080/1080',
      'https://picsum.photos/id/50/1080/1080',
      'https://picsum.photos/id/60/1080/1080',
      'https://picsum.photos/id/70/1080/1080',
      'https://picsum.photos/id/80/1080/1080',
      'https://picsum.photos/id/90/1080/1080',
      'https://picsum.photos/id/100/1080/1080',
    ],
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    musicTitle: 'Chill Beats',
    content: 'Testing maximum capacity carousel! All 10 images loaded 📸',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    likedBy: [],
    commentsCount: 23,
    reactions: {},
    reactionCounts: {},
    coverImageIndex: 0,
  };

  // Single image carousel (minimum)
  const singleImagePost = {
    id: 'test-carousel-3',
    userId: 'test-user-3',
    userChannel: '@SingleUser',
    type: 'carousel' as const,
    images: [
      'https://picsum.photos/id/237/1080/1080', // Dog
    ],
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    content: 'Even a single image looks great with music! 🐕🎵',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    likedBy: [],
    commentsCount: 12,
    reactions: {},
    reactionCounts: {},
    coverImageIndex: 0,
  };

  // Carousel without music
  const noMusicPost = {
    id: 'test-carousel-4',
    userId: 'test-user-4',
    userChannel: '@QuietUser',
    type: 'carousel' as const,
    images: [
      'https://picsum.photos/id/180/1080/1080',
      'https://picsum.photos/id/181/1080/1080',
      'https://picsum.photos/id/182/1080/1080',
    ],
    content: 'Music is optional! This carousel has no soundtrack.',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    likedBy: [],
    commentsCount: 7,
    reactions: {},
    reactionCounts: {},
    coverImageIndex: 0,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Carousel Post Test Suite</Text>
        <Text style={styles.subtitle}>
          Test all carousel variations below
        </Text>
      </View>

      {/* Test Case 1: Standard 3-image carousel */}
      <View style={styles.testCase}>
        <Text style={styles.testTitle}>Test 1: Standard Carousel (3 images + music)</Text>
        <PostCard 
          post={sampleCarouselPost}
          currentUserId="test-user"
          profile={mockProfile}
          onLike={() => console.log('Like')}
          onReact={() => console.log('React')}
          onComment={() => console.log('Comment')}
          onViewProfile={() => console.log('View Profile')}
          onDelete={() => console.log('Delete')}
          playingVideoId={null}
          onVideoPlay={() => {}}
          pauseCarouselMusic={false}
        />
      </View>

      {/* Test Case 2: Maximum images */}
      <View style={styles.testCase}>
        <Text style={styles.testTitle}>Test 2: Maximum Images (10 images + music)</Text>
        <PostCard 
          post={maxImagesPost}
          currentUserId="test-user"
          profile={mockProfile}
          onLike={() => console.log('Like')}
          onReact={() => console.log('React')}
          onComment={() => console.log('Comment')}
          onViewProfile={() => console.log('View Profile')}
          onDelete={() => console.log('Delete')}
          playingVideoId={null}
          onVideoPlay={() => {}}
          pauseCarouselMusic={false}
        />
      </View>

      {/* Test Case 3: Single image */}
      <View style={styles.testCase}>
        <Text style={styles.testTitle}>Test 3: Single Image (1 image + music)</Text>
        <PostCard 
          post={singleImagePost}
          currentUserId="test-user"
          profile={mockProfile}
          onLike={() => console.log('Like')}
          onReact={() => console.log('React')}
          onComment={() => console.log('Comment')}
          onViewProfile={() => console.log('View Profile')}
          onDelete={() => console.log('Delete')}
          playingVideoId={null}
          onVideoPlay={() => {}}
          pauseCarouselMusic={false}
        />
      </View>

      {/* Test Case 4: No music */}
      <View style={styles.testCase}>
        <Text style={styles.testTitle}>Test 4: No Music (3 images, no audio)</Text>
        <PostCard 
          post={noMusicPost}
          currentUserId="test-user"
          profile={mockProfile}
          onLike={() => console.log('Like')}
          onReact={() => console.log('React')}
          onComment={() => console.log('Comment')}
          onViewProfile={() => console.log('View Profile')}
          onDelete={() => console.log('Delete')}
          playingVideoId={null}
          onVideoPlay={() => {}}
          pauseCarouselMusic={false}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✅ If all carousels render correctly, Feature 2 is working!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  testCase: {
    marginTop: 20,
    backgroundColor: '#fff',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default TestCarouselPost;
