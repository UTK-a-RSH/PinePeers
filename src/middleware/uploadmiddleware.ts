import multer from 'multer';
import path from 'path';
import fs from 'fs';
// Middleware for handling video uploads using multer

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});


// Configure multer for video uploads
const videoUpload = multer({
  storage,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 1 // Only one file at a time
  }
});

// Export middleware functions
export const uploadSingleVideo = videoUpload.single('video');

// Alternative: if you need multiple file upload in future
export const uploadMultipleVideos = videoUpload.array('videos', 5); // Max 5 files

