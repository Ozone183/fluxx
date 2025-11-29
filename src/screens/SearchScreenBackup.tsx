import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS } from '../theme/colors';
import { APP_ID } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Profile {
  userId: string;
  channel: string;
  profilePictureUrl: string | null;
}

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);

    if (term.trim().length < 1) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const profilesRef = collection(firestore, 'artifacts', APP_ID, 'public', 'data', 'profiles');
      const snapshot = await getDocs(profilesRef);

      const profiles = snapshot.docs
        .map(doc => doc.data() as Profile)
        .filter(profile =>
          profile.channel.toLowerCase().includes(term.toLowerCase()),
        )
        .slice(0, 20);

      setResults(profiles);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleViewProfile = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate('Profile', { userId });
  };

  const renderResult = ({ item }: { item: Profile }) => {
    const initials = item.channel.replace('@', '').substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => handleViewProfile(item.userId)}
        activeOpacity={0.7}
      >
        {item.profilePictureUrl ? (
          <Image
            source={{ uri: item.profilePictureUrl }}
            style={styles.avatar}
          />
        ) : (
          <LinearGradient
            colors={getGradientForChannel(item.channel)}
            style={styles.avatar}
          >
            <Text style={styles.initials}>{initials}</Text>
          </LinearGradient>
        )}
        <Text style={styles.channel}>{item.channel}</Text>
        <Icon name="chevron-forward-outline" size={20} color={COLORS.slate400} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.slate900, COLORS.slate800]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Search Channels</Text>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={COLORS.slate400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={handleSearch}
            placeholder="Search by @channel..."
            placeholderTextColor={COLORS.slate500}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close" size={20} color={COLORS.slate400} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Results */}
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {searchTerm.trim().length === 0 ? (
              <>
                <Icon name="people-outline" size={64} color={COLORS.slate600} />
                <Text style={styles.emptyText}>Discover Channels</Text>
                <Text style={styles.emptySubtext}>
                  Start typing to find amazing people on Fluxx
                </Text>
              </>
            ) : isSearching ? (
              <>
                <Icon name="reload-outline" size={40} color={COLORS.cyan400} />
                <Text style={styles.emptyText}>Searching...</Text>
              </>
            ) : (
              <>
                <Icon name="sad-outline" size={64} color={COLORS.slate600} />
                <Text style={styles.emptyText}>No Results</Text>
                <Text style={styles.emptySubtext}>
                  No channels found for "{searchTerm}"
                </Text>
              </>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const getGradientForChannel = (channel: string): readonly [string, string] => {
  const colors = [
    [COLORS.indigo600, COLORS.pink600] as const,
    [COLORS.cyan500, COLORS.indigo600] as const,
    [COLORS.teal500, COLORS.green600] as const,
  ];
  return colors[(channel?.length || 0) % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate800,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate800,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.slate700,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cyan400,
  },
  initials: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  channel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.slate400,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default SearchScreen;
