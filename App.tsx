import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { createNavigationContainerRef } from '@react-navigation/native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';

import AnimatedSplash from './src/screens/AnimatedSplash';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ChannelSetupScreen from './src/screens/ChannelSetupScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SearchScreen from './src/screens/SearchScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import CreateCanvasScreen from './src/screens/CreateCanvasScreen';
import CanvasEditorScreen from './src/screens/CanvasEditorScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import DiscoveryFeedScreen from './src/screens/DiscoveryFeedScreen';
import ProfileMenuDrawer from './src/screens/ProfileMenuDrawer';
import CreateModal from './src/components/CreateModal';

import { COLORS } from './src/theme/colors';

import { LogBox } from 'react-native';

// Suppress harmless animated warnings
LogBox.ignoreLogs([
  'Style property \'width\' is not supported by native animated module',
  'Style property \'left\' is not supported by native animated module',
]);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const navigation = useNavigation();

  return (
    <>
      <Tab.Navigator
    id={undefined}
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.slate900,
        borderTopColor: COLORS.slate800,
        height: 120,
        paddingBottom: 25,
        paddingTop: 10,
      },
      tabBarActiveTintColor: COLORS.cyan400,
      tabBarInactiveTintColor: COLORS.slate500,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 5,
      },
      tabBarIconStyle: {
        marginTop: 5,
      },
    }}>
    <Tab.Screen
      name="Feed"
      component={FeedScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="home-outline" size={focused ? 28 : 24} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Discovery"
      component={DiscoveryFeedScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="compass-outline" size={focused ? 28 : 24} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Create"
      component={() => null}
      listeners={{
        tabPress: () => {
          setShowCreateModal(true);
        },
      }}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="add-circle" size={focused ? 32 : 28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Menu"
      component={ProfileMenuDrawer}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="menu-outline" size={focused ? 28 : 24} color={color} />
        ),
      }}
    />
  </Tab.Navigator>

{/* Create Modal */}
<CreateModal
  visible={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreatePost={() => navigation.navigate('CreatePost' as never)}
  onCreateCanvas={() => navigation.navigate('Canvas' as never)}
/>
</>
);
};

const AppNavigator = () => {
  const { isAuthReady, userId, isProfileSetup } = useAuth();

  if (!isAuthReady) return <AuthLoadingScreen />;

  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      {!userId ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : !isProfileSetup ? (
        <Stack.Screen name="ChannelSetup" component={ChannelSetupScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Canvas" component={CreateCanvasScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="CanvasEditor" component={CanvasEditorScreen} />
          <Stack.Screen name="Comments" component={CommentsScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const navigationRef = createNavigationContainerRef();

// NEW: Separate component that uses useAuth
const AppContent = () => {
  const { userId, isProfileSetup } = useAuth(); // ✅ Now inside AuthProvider
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleDeepLink = (url: string) => {
    try {
      const { path } = Linking.parse(url);
      
      console.log('🔗 Deep link received:', url);
      console.log('📍 Parsed path:', path);
      console.log('👤 User ID:', userId);
      console.log('✅ Profile setup:', isProfileSetup);
      
      if (path?.startsWith('canvas/')) {
        const canvasId = path.replace('canvas/', '');
        console.log('🎨 Canvas ID extracted:', canvasId);
        
        if (userId && isProfileSetup) {
          console.log('✅ Navigating to canvas...');
          (navigationRef.current as any)?.navigate('CanvasEditor', { canvasId });
        } else {
          console.log('❌ User not authenticated, cannot navigate');
        }
      } else {
        console.log('❌ Invalid deep link path');
      }
    } catch (error) {
      console.error('❌ Deep link error:', error);
    }
  };

  // Deep linking handler
  useEffect(() => {
    // Handle initial URL (app opened from link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [userId, isProfileSetup]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleOnboardingFinish = () => {
    setShowOnboarding(false);
  };

  if (isCheckingOnboarding) {
    return null;
  }

  if (showSplash) {
    return <AnimatedSplash onFinish={handleSplashFinish} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  return (
    <ProfileProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.slate900} />
        <AppNavigator />
      </NavigationContainer>
    </ProfileProvider>
  );
};

// Main App component wraps everything in AuthProvider
const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;