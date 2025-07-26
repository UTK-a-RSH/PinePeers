
import { existsSync, mkdirSync, createWriteStream, writeFileSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';

// **Parse Command-Line Arguments**

const downloadUrlIndex = process.argv.indexOf('--download-url');
const uploadPathIndex = process.argv.indexOf('--upload-path');

if (downloadUrlIndex === -1 || uploadPathIndex === -1) {
  console.error('Error: Both --download-url and --upload-path are required');
  process.exit(1);
}

const downloadUrl = process.argv[downloadUrlIndex + 1];
const uploadPath = process.argv[uploadPathIndex + 1];

// **Setup Temporary Directory**
const tempDir = join(__dirname, 'temp');
const inputPath = join(tempDir, 'input-video.mp4');

if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// **Define Video Resolutions for HLS**
const resolutions = [
  { size: '426x240', bitrate: '400k', label: '240p' },
  { size: '640x360', bitrate: '800k', label: '360p' },
  { size: '854x480', bitrate: '1200k', label: '480p' },
  { size: '1280x720', bitrate: '2500k', label: '720p' },
];

// **Download Video Function**
// Use https instead of Axios
async function downloadVideo() {
    try {
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
        const fileStream = createWriteStream(inputPath);
        await new Promise((resolve, reject) => {
          response.body.pipe(fileStream);
          response.body.on('error', reject);
          fileStream.on('finish', resolve);
        });
      } catch (error) {
        console.error('Error downloading video:', error.message);
        throw error;
      }
}

// Generate variant playlists and a master playlist
async function transcodeVideo() {
  // Ensure uploadPath exists (should be mounted, but check anyway)
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  // Transcode each resolution into its own HLS playlist
  const promises = resolutions.map((res) => {
    const variantPlaylist = join(uploadPath, `${res.label}.m3u8`);
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-s ${res.size}`,           // Resolution
          `-b:v ${res.bitrate}`,      // Video bitrate
          '-hls_time 10',             // Segment duration
          '-hls_list_size 0',         // Include all segments
          `-hls_segment_filename ${join(uploadPath, `${res.label}_%03d.ts`)}`,
        ])
        .output(variantPlaylist)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  });

  // Wait for all transcoding to complete
  await Promise.all(promises);

  // Generate the master playlist
  const masterPlaylistContent = [
    '#EXTM3U',
    ...resolutions.map((res) => {
      const bandwidth = parseInt(res.bitrate.replace('k', '')) * 1000;
      return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.size}\n${res.label}.m3u8`;
    }),
  ].join('\n');
  writeFileSync(join(uploadPath, 'playlist.m3u8'), masterPlaylistContent);
}

// **Main Execution Function**
async function main() {
  try {
    console.log('Downloading video...');
    await downloadVideo();
    console.log('Transcoding video...');
    await transcodeVideo();
    console.log('Transcoding completed successfully');
    // Optional: Clean up temp directory
    unlinkSync(inputPath);
    rmdirSync(tempDir);
  } catch (error) {
    console.error('Error in transcoding process:', error.message);
    process.exit(1);
  }
}

// Run the script
main();