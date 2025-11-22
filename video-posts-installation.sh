#!/bin/bash

# Video Posts Feature - Package Installation Script
# For Fluxx Social Media App

echo "📦 Installing video posts dependencies..."
echo ""

# Install required Expo packages
echo "Installing expo-av (video playback)..."
npx expo install expo-av

echo "Installing expo-video-thumbnails (thumbnail generation)..."
npx expo install expo-video-thumbnails

echo "Installing expo-image-picker (video selection and recording)..."
npx expo install expo-image-picker

echo "Installing expo-media-library (video access)..."
npx expo install expo-media-library

echo "Installing @react-native-community/slider (progress bar)..."
npx expo install @react-native-community/slider

echo ""
echo "✅ All packages installed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy component files to src/components/"
echo "2. Copy screen file to src/screens/"
echo "3. Copy service files to src/services/"
echo "4. Update your navigation (see implementation guide)"
echo "5. Update CreateModal (see modal update guide)"
echo ""
echo "See UPDATED_IMPLEMENTATION_GUIDE.md for complete instructions."
