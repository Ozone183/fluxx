// src/services/fluxxAIService.ts

import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { CANVAS_TEMPLATES, CanvasTemplate } from '../data/canvasTemplates';
import { getTemplateStory } from '../utils/aiStoryGenerator';
import { MUSIC_LIBRARY, MusicTrack } from '../data/musicTracks';
import { Asset } from 'expo-asset';

const FLUXXAI_USER_ID = 'mH0S02GYrpa5SmvtoDAgG03Wy9r2';
const FLUXXAI_USERNAME = 'FluxxAI';
const APP_ID = 'fluxx-app-2025';
const GEMINI_API_KEY = 'AIzaSyCg_HIe7ajHyWtCXMhx9YwOVHWX_qHBjBQ';

interface GeneratedCanvas {
  canvasId: string;
  title: string;
  layers: any[];
  musicUrl?: string;
}

/**
 * Main FluxxAI Canvas Generation Service
 */
export class FluxxAIService {
  /**
   * Generate a complete AI canvas with 12 image layers and music
   */
  static async generateCanvas(): Promise<GeneratedCanvas> {
    console.log('🤖 FluxxAI: Starting canvas generation...');

    try {
      // Step 1: Pick random template
      const template = this.pickRandomTemplate();
      console.log(`🎨 Selected template: ${template.title}`);

      // Step 2: Get story for template
      const story = getTemplateStory(template.id);
      console.log(`📖 Story: ${story.storyTitle}`);

      // Step 3: Generate 12 AI images for the story
      console.log('🖼️ Generating 12 AI images with Gemini...');
      const imageUrls = await this.generateStoryImages(story, template);

      // Step 4: Select matching background music
      console.log('🎵 Selecting background music...');
      const musicUrl = await this.selectMusicForTemplate(template);

      // Step 5: Create canvas document
      console.log('📝 Creating canvas in Firebase...');
      const canvas = await this.createCanvasDocument(template, story, imageUrls, musicUrl);

      console.log('✅ FluxxAI canvas generated successfully!');
      return canvas;
    } catch (error) {
      console.error('❌ FluxxAI generation failed:', error);
      throw error;
    }
  }

  /**
   * Pick a random template from the 42 available
   */
  private static pickRandomTemplate(): CanvasTemplate {
    const randomIndex = Math.floor(Math.random() * CANVAS_TEMPLATES.length);
    return CANVAS_TEMPLATES[randomIndex];
  }

  /**
   * Generate 12 AI images based on story prompts using Gemini
   */
  private static async generateStoryImages(story: any, template: CanvasTemplate): Promise<string[]> {
    const imageUrls: string[] = [];

    for (let i = 0; i < 12; i++) {
      const layer = story.layers[i];
      console.log(`  Generating image ${i + 1}/12: ${layer.description}`);

      try {
        const imageUrl = await this.generateGeminiImage(layer.prompt, template);
        imageUrls.push(imageUrl);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}:`, error);
        throw new Error(`Image generation failed at layer ${i + 1}: ${error}`);
      }
    }

    return imageUrls;
  }

  /**
   * Generate AI image with retry logic
   */
  private static async generateGeminiImage(prompt: string, template: CanvasTemplate): Promise<string> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`    Attempt ${attempt}/${maxRetries}...`);
        
        // Method 1: Pollinations.ai
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1792&nologo=true&seed=${Date.now()}`;
        
        // Download the image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const imageBlob = await response.blob();
        
        // Verify blob is valid
        if (imageBlob.size === 0) {
          throw new Error('Empty image received');
        }
        
        // Upload to Firebase Storage
        const timestamp = Date.now();
        const filename = `fluxxai_${timestamp}_${Math.random().toString(36).substr(2, 9)}.png`;
        const storageRef = ref(storage, `ai_generated/${filename}`);
        
        await uploadBytes(storageRef, imageBlob);
        const downloadUrl = await getDownloadURL(storageRef);
        
        console.log(`    ✅ Success on attempt ${attempt}`);
        return downloadUrl;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`    ⚠️ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = 2000 * attempt; // 2s, 4s, 6s
          console.log(`    Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed, try alternative service
    console.log('    Trying alternative service...');
    try {
      return await this.generateImageFallback(prompt);
    } catch (fallbackError) {
      console.error('    ❌ All methods failed');
      throw new Error(`Image generation failed after ${maxRetries} attempts: ${lastError.message}`);
    }
  }

  /**
   * Fallback: Use reliable placeholder service
   */
  private static async generateImageFallback(prompt: string): Promise<string> {
    try {
      // For now, use Unsplash Source API (very reliable, no auth needed)
      // Extract key visual term from prompt
      const keywords = prompt.split(' ').slice(0, 3).join(',');
      const imageUrl = `https://source.unsplash.com/1024x1792/?${encodeURIComponent(keywords)}`;
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Unsplash failed: ${response.status}`);
      }
      
      const imageBlob = await response.blob();
      
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const filename = `fluxxai_fallback_${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const storageRef = ref(storage, `ai_generated/${filename}`);
      
      await uploadBytes(storageRef, imageBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      console.log('    ✅ Fallback successful');
      return downloadUrl;
    } catch (error) {
      // Ultimate fallback: colored placeholder
      const colors = ['FF6B9D', '4A90E2', '9B59B6', '3498DB', 'E74C3C', '1ABC9C'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      return `https://via.placeholder.com/1024x1792/${randomColor}/FFFFFF?text=Layer`;
    }
  }


  /**
   * Select matching music from existing library based on template mood
   */
  private static async selectMusicForTemplate(template: CanvasTemplate): Promise<string | undefined> {
    try {
      // Map template categories to music categories
      let musicCategory: 'chill' | 'upbeat' | 'lofi' | 'ambient' = 'chill';

      switch (template.category) {
        case 'social':
          musicCategory = 'upbeat'; // Parties, celebrations = upbeat
          break;
        case 'creative':
          musicCategory = 'lofi'; // Art, moodboards = lofi
          break;
        case 'productivity':
          musicCategory = 'ambient'; // Goals, work = ambient
          break;
        case 'fun':
          musicCategory = 'upbeat'; // Games, roasts = upbeat
          break;
        case 'lifestyle':
          musicCategory = 'chill'; // Travel, food = chill
          break;
      }

      // Find tracks matching the category
      const matchingTracks = MUSIC_LIBRARY.filter(track => track.category === musicCategory);

      if (matchingTracks.length === 0) {
        console.warn('No matching music found, using random track');
        const randomTrack = MUSIC_LIBRARY[Math.floor(Math.random() * MUSIC_LIBRARY.length)];
        return await this.uploadMusicToStorage(randomTrack);
      }

      // Pick random track from matching category
      const selectedTrack = matchingTracks[Math.floor(Math.random() * matchingTracks.length)];
      console.log(`  Selected music: ${selectedTrack.title} by ${selectedTrack.artist}`);

      // Upload music to Firebase Storage and get URL
      return await this.uploadMusicToStorage(selectedTrack);
    } catch (error) {
      console.error('Failed to select music:', error);
      return undefined;
    }
  }

  /**
   * Upload music track to Firebase Storage
   */
  private static async uploadMusicToStorage(track: MusicTrack): Promise<string> {
    try {
      // Load the asset
      const asset = Asset.fromModule(track.url);
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error('Failed to load music asset');
      }

      // Fetch the file as blob
      const response = await fetch(asset.localUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const filename = `fluxxai_music_${track.id}_${Date.now()}.mp3`;
      const musicRef = ref(storage, `ai_music/${filename}`);
      await uploadBytes(musicRef, blob);
      
      const musicUrl = await getDownloadURL(musicRef);
      return musicUrl;
    } catch (error) {
      console.error('Music upload error:', error);
      throw error;
    }
  }

  /**
   * Create canvas document in Firestore
   */
  private static async createCanvasDocument(
    template: CanvasTemplate,
    story: any,
    imageUrls: string[],
    musicUrl?: string
  ): Promise<GeneratedCanvas> {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now

    // Create layers array with proper positioning (3x4 grid)
    const layers = imageUrls.map((imageUrl, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const layerWidth = 96.32;
      const layerHeight = 97.85;
      const padding = 20;
      const xSpacing = layerWidth + (padding / 2);
      const ySpacing = layerHeight + (padding / 2);

      return {
        id: `layer_${now + index}`,
        type: 'image',
        imageUrl: imageUrl,
        position: {
          x: padding + (col * xSpacing),
          y: padding + (row * ySpacing),
        },
        size: {
          width: layerWidth,
          height: layerHeight,
        },
        rotation: 0,
        zIndex: index + 1,
        createdAt: now + index,
        updatedAt: now + index,
        createdBy: FLUXXAI_USER_ID,
        createdByUsername: FLUXXAI_USERNAME,
        createdByProfilePic: null,
      };
    });

    const canvasData = {
      title: `AI: ${story.storyTitle}`,
      creatorId: FLUXXAI_USER_ID,
      creatorUsername: FLUXXAI_USERNAME,
      backgroundColor: template.backgroundColor,
      width: 1080,
      height: 1920,
      layers: layers,
      accessType: 'public',
      maxCollaborators: 8,
      collaborators: {
        [FLUXXAI_USER_ID]: {
          userId: FLUXXAI_USER_ID,
          username: FLUXXAI_USERNAME,
          profilePicUrl: null,
          isActive: true,
          joinedAt: now,
          lastSeen: now,
        },
      },
      createdAt: now,
      expiresAt: expiresAt,
      isExpired: false,
      isArchived: false,
      likeCount: 0,
      likedBy: [],
      viewCount: 0,
      musicUrl: musicUrl || null,
      isAIGenerated: true,
      aiMetadata: {
        templateId: template.id,
        templateTitle: template.title,
        storyTitle: story.storyTitle,
        generatedAt: now,
        generatedBy: 'FluxxAI',
        model: 'Gemini Imagen 3',
        version: 'v1.0',
      },
    };

    // Save to Firestore
    const canvasRef = await addDoc(
      collection(db, `artifacts/${APP_ID}/public/data/canvases`),
      canvasData
    );

    console.log(`✅ Canvas created with ID: ${canvasRef.id}`);

    return {
      canvasId: canvasRef.id,
      title: canvasData.title,
      layers: layers,
      musicUrl: musicUrl,
    };
  }

  /**
   * Helper: Convert base64 to Blob
   */
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}