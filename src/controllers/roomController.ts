import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose'; 
import Room from '../db/room.model';
import { CustomError } from '../types/customError';

export const createRoom = async (req: Request, res: Response) => {
  const { name } = req.body;


  if (typeof name !== 'string' || name.trim() === '') {
    throw new CustomError('Room name must be a non-empty string', 400);
  }

  const hostId = uuidv4();
  const newRoom = new Room({ name: name.trim(), hostId, users: [], currentVideo: null }); 
  const savedRoom = await newRoom.save();

  
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const shareableLink = `${baseUrl}/room/${savedRoom._id}`;

  res.status(201).json({ roomId: savedRoom._id, hostId, shareableLink });
};







export const getAllRooms = async (req: Request, res: Response) => {
  const rooms = await Room.find({}, '_id name');
  res.status(200).json(rooms);
};








export const getRoomById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid Room ID format', 400);
  }

  const room = await Room.findById(id);
  if (!room) {
    throw new CustomError('Room not found', 404);
  }
  res.status(200).json(room);
};








export const updateRoom = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, currentVideo } = req.body;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid Room ID format', 400);
  }

  // Basic validation for name if provided
  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      throw new CustomError('Room name must be a non-empty string', 400);
  }

  // Validate currentVideo if provided: must be a non-empty string or null
  if (currentVideo !== undefined && currentVideo !== null && (typeof currentVideo !== 'string' || currentVideo.trim() === '')) {
    throw new CustomError('currentVideo must be a non-empty string or null', 400);
  }

  // Prepare update object, only including fields that are present in the request
  const updateData: { name?: string; currentVideo?: string | null } = {}; // Corrected type
  if (name !== undefined) updateData.name = name.trim(); // Trim name if provided
  if (currentVideo !== undefined) updateData.currentVideo = currentVideo; // Allow null


  const updatedRoom = await Room.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  if (!updatedRoom) {
    throw new CustomError('Room not found', 404);
  }
  res.status(200).json(updatedRoom);
};









export const deleteRoom = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid Room ID format', 400);
  }

  const deletedRoom = await Room.findByIdAndDelete(id);
  if (!deletedRoom) {
    throw new CustomError('Room not found', 404);
  }
  res.status(200).json({ message: 'Room deleted successfully' });
};
