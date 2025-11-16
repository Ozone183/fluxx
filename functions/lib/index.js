"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideo = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const os = require("os");
const fs = require("fs");
admin.initializeApp();
exports.processVideo = functions
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
        const frameFiles = [];
        for (let i = 0; i < frameCount; i++) {
            const framePath = path.join(tempDir, `frame_${i.toString().padStart(4, '0')}.jpg`);
            fs.copyFileSync(canvasLocalPath, framePath);
            frameFiles.push(framePath);
        }
        console.log(`Created ${frameFiles.length} frames`);
        // Create video with FFmpeg
        const outputPath = path.join(tempDir, 'output.mp4');
        const framePattern = path.join(tempDir, 'frame_%04d.jpg');
        await new Promise((resolve, reject) => {
            let command = ffmpeg()
                .input(framePattern)
                .inputFPS(30)
                .size('350x622')
                .videoCodec('libx264')
                .outputOptions([
                '-pix_fmt yuv420p',
                '-preset fast',
                '-crf 28',
                '-vf scale=350:622',
            ]);
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
                contentType: 'video/mp4',
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
    }
    catch (error) {
        console.error('Error processing video:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process video');
    }
});
//# sourceMappingURL=index.js.map