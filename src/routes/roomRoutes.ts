import { Router } from 'express';
import asyncHandler from '../middleware/asyncHandler'; 
import {
  createRoom,
  getRoomById,
  getAllRooms,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController'; 

const router = Router();

// --- Room Routes ---

// Create a new room
router.post('/new', asyncHandler(createRoom));



// Get all rooms
router.get('/', asyncHandler(getAllRooms));



// Get a specific room by ID
router.get('/:id', asyncHandler(getRoomById));



// Update a specific room by ID
router.put('/:id', asyncHandler(updateRoom));




// Delete a specific room by ID
router.delete('/:id', asyncHandler(deleteRoom));

export default router;
