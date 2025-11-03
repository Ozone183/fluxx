import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

import { COLORS } from './src/theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    id={undefined}
    screenOptions={{
      headerShown: false,
      tabBarStyle: { 
        backgroundColor: COLORS.slate900, 
        borderTopColor: COLORS.slate800,
        height: 70, // Fixed: reduced from 85
        paddingBottom: 10, // Fixed: reduced from 25
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
      name="Search" 
      component={SearchScreen} 
      options={{ 
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="search-outline" size={focused ? 28 : 24} color={color} />
        ),
      }} 
    />
    <Tab.Screen 
      name="CreatePost" 
      component={CreatePostScreen} 
      options={{ 
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="add-circle-outline" size={focused ? 32 : 28} color={color} />
        ),
        tabBarLabel: 'Post',
      }} 
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ 
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name="person-outline" size={focused ? 28 : 24} color={color} />
        ),
      }} 
    />
  </Tab.Navigator>
);

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
          <Stack.Screen name="Comments" component={CommentsScreen} options={{ presentation: 'modal' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ProfileProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.slate900} />
            <AppNavigator />
          </NavigationContainer>
        </ProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;