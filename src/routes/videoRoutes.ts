import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import { uploadSingleVideo } from '../middleware/uploadmiddleware';
import { 
  uploadVideo, 
} from '../controllers/videoController';

const router = Router();

// Upload a new video - using the middleware
router.post('/upload', uploadSingleVideo, asyncHandler(uploadVideo));


export default router;