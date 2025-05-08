// src/db/video.ts

import mongoose, { Schema, Document } from 'mongoose';
import { IVideo } from '../types/video';

// Interface for Video document combining IVideo with Mongoose Document
interface IVideoDocument extends IVideo,  Document {
  _id: string;
  roomId: mongoose.Types.ObjectId;
}

// Define the Video schema
const VideoSchema = new Schema<IVideoDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  roomId: {
    type: Schema.Types.ObjectId, 
    ref: 'Room',
    required: true,
  },
  hlsUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update 'updatedAt' before saving
VideoSchema.pre('save', function (this: IVideoDocument, next) { 
  this.updatedAt = new Date();
  next();
});

// Create and export the Video model
export default mongoose.model<IVideoDocument>('Video', VideoSchema);
