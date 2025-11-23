import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// @ts-ignore
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

admin.initializeApp();

// ==========================================
// EXISTING FUNCTION: Canvas Video Export
// ==========================================
export const processVideo = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '2GB',
  })
  .https.onCall(async (data, context) => {
    try {
      const { canvasId, frameCount, musicUrl } = data;

      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      console.log(`Processing video for canvas: ${canvasId}, frames: ${frameCount}`);

      const bucket = admin.storage().bucket();
      const tempDir = path.join(os.tmpdir(), `video_${canvasId}_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Download single canvas image and duplicate it
      console.log('Downloading canvas...');
      const canvasPath = `video-exports/${canvasId}/canvas.jpg`;
      const canvasLocalPath = path.join(tempDir, 'canvas.jpg');

      await bucket.file(canvasPath).download({ destination: canvasLocalPath });
      console.log('✅ Canvas downloaded');

      // Duplicate the canvas image to create all frames
      console.log('Creating frames...');
      const frameFiles: string[] = [];

      for (let i = 0; i < frameCount; i++) {
        const framePath = path.join(tempDir, `frame_${i.toString().padStart(4, '0')}.jpg`);
        fs.copyFileSync(canvasLocalPath, framePath);
        frameFiles.push(framePath);
      }

      console.log(`Created ${frameFiles.length} frames`);

      // Create video with FFmpeg
      const outputPath = path.join(tempDir, 'output.webm');
      const framePattern = path.join(tempDir, 'frame_%04d.jpg');

      await new Promise<void>((resolve, reject) => {
        console.log('🎬 Starting FFmpeg conversion...');
        let command = ffmpeg()
          .input(framePattern)
          .inputFPS(30)
          .size('350x622')
          .videoCodec('libvpx')
          .format('webm')
          .outputOptions([
            '-crf 30',
            '-b:v 1M',
          ])
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          });

        // Add music if provided
        if (musicUrl) {
          command = command.input(musicUrl).outputOptions(['-shortest']);
        }

        // Add watermark
        command = command.outputOptions([
          '-vf',
          "drawtext=text='Made with Fluxx':fontsize=24:fontcolor=white:x=W-tw-10:y=H-th-10:borderw=2:bordercolor=black"
        ]);

        command
          .output(outputPath)
          .on('end', () => {
            console.log('Video processing complete');
            resolve();
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
          })
          .run();
      });

      // Upload final video to Firebase Storage
      console.log('Uploading final video...');
      const videoFileName = `video-exports/${canvasId}/final_${Date.now()}.mp4`;
      await bucket.upload(outputPath, {
        destination: videoFileName,
        metadata: {
          contentType: 'video/webm',
        },
      });

      // Get signed URL (7 days expiry)
      const [url] = await bucket.file(videoFileName).getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Cleanup temp files
      console.log('Cleaning up temp files...');
      fs.rmSync(tempDir, { recursive: true, force: true });

      // Delete canvas file from Storage
      await bucket.file(`video-exports/${canvasId}/canvas.jpg`).delete().catch(() => { });

      console.log('Video processing complete!');
      return { videoUrl: url };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process video');
    }
  });

// ==========================================
// NEW FUNCTION: Video Post Compression
// ==========================================
const storage = new Storage();
const bucket = storage.bucket('fluxx-fe69f.firebasestorage.app');

export const compressVideoPost = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    if (!filePath || !filePath.startsWith('videos/') || !contentType?.startsWith('video/')) {
      console.log('Not a video in videos folder, skipping');
      return null;
    }

    if (filePath.includes('_compressed')) {
      console.log('Already compressed, skipping');
      return null;
    }

    console.log('🎥 Processing video:', filePath);

    const fileName = path.basename(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const compressedFileName = fileName.replace('.mp4', '_compressed.mp4');
    const compressedTempPath = path.join(os.tmpdir(), compressedFileName);
    const compressedStoragePath = filePath.replace(fileName, compressedFileName);

    try {
      console.log('⬇️ Downloading original video...');
      await bucket.file(filePath).download({ destination: tempFilePath });

      const stats = fs.statSync(tempFilePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`📊 Original size: ${fileSizeInMB.toFixed(2)} MB`);

      console.log('🔄 Compressing video...');
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath)
          .output(compressedTempPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size('?x720')
          .videoBitrate('800k')
          .audioBitrate('128k')
          .format('mp4')
          .outputOptions([
            '-preset fast',
            '-movflags +faststart',
            '-pix_fmt yuv420p',
          ])
          .on('start', (cmd) => console.log('🎬 FFmpeg:', cmd))
          .on('progress', (progress) => console.log(`⏳ ${progress.percent?.toFixed(1)}%`))
          .on('end', () => {
            console.log('✅ Compression complete');
            resolve();
          })
          .on('error', (err) => {
            console.error('❌ FFmpeg error:', err);
            reject(err);
          })
          .run();
      });

      const compressedStats = fs.statSync(compressedTempPath);
      const compressedSizeInMB = compressedStats.size / (1024 * 1024);
      console.log(`📊 Compressed size: ${compressedSizeInMB.toFixed(2)} MB`);

      console.log('⬆️ Uploading compressed video...');
      await bucket.upload(compressedTempPath, {
        destination: compressedStoragePath,
        metadata: {
          contentType: 'video/mp4',
          metadata: {
            originalSize: fileSizeInMB.toFixed(2),
            compressedSize: compressedSizeInMB.toFixed(2),
          },
        },
      });

      const file = bucket.file(compressedStoragePath);
      const [metadata] = await file.getMetadata();
      const token = metadata.metadata?.firebaseStorageDownloadTokens || Date.now().toString();

      const compressedUrl = `https://firebasestorage.googleapis.com/v0/b/fluxx-fe69f.firebasestorage.app/o/${encodeURIComponent(compressedStoragePath)}?alt=media&token=${token}`;

      console.log('🔗 Compressed URL:', compressedUrl);

      // Update Firestore post
      const pathParts = filePath.split('/');
      const userId = pathParts[1];

      const postsRef = admin.firestore()
        .collection('artifacts')
        .doc('fluxx')
        .collection('public')
        .doc('data')
        .collection('posts');

      // Search for posts with isProcessing = true from this user
      const querySnapshot = await postsRef
        .where('userId', '==', userId)
        .where('isProcessing', '==', true)
        .limit(5)
        .get();

      let postUpdated = false;
      for (const doc of querySnapshot.docs) {
        const postData = doc.data();
        // Match by checking if original video URL is in the post
        if (postData.videoUrl && postData.videoUrl.includes(pathParts[2].replace('.mp4', ''))) {
          await doc.ref.update({
            videoUrl: compressedUrl,
            isProcessing: false,  // ← SET TO FALSE
            compressedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log('✅ Updated post:', doc.id);
          postUpdated = true;
          break;
        }
      }

      if (!postUpdated) {
        console.log('⚠️ Post not found');
      }

      fs.unlinkSync(tempFilePath);
      fs.unlinkSync(compressedTempPath);
      console.log('🧹 Cleaned up');

      return null;
    } catch (error) {
      console.error('❌ Error:', error);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      if (fs.existsSync(compressedTempPath)) fs.unlinkSync(compressedTempPath);
      throw error;
    }
  });