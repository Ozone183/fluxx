import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

admin.initializeApp();

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
      const outputPath = path.join(tempDir, 'output.webm');  // Changed from .mp4
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
          contentType: 'video/webm',  // Changed from video/mp4
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
      await bucket.file(`video-exports/${canvasId}/canvas.jpg`).delete().catch(() => {});

      console.log('Video processing complete!');
      return { videoUrl: url };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process video');
    }
  });
