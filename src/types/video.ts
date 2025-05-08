import mongoose from "mongoose";



export interface IVideo {
    _id: string;              // MongoDB-generated unique identifier
    title: string;            // Name of the video
    description?: string;     // Optional description of the video
    roomId: mongoose.Types.ObjectId;           // Reference to the Room this video belongs to
    hlsUrl: string | null;    // HLS URL for streaming, null until processed
    status: 'pending' | 'processing' | 'ready'; // Video processing state
    createdAt: Date;          // Timestamp of video creation
    updatedAt: Date;          // Timestamp of last update
  }
  

  export interface IVideoUploadRequest {
    title: string;            // Required title for the video
    description?: string;     // Optional description
    roomId: string;           // Room where the video is uploaded
  }
  
  
  export interface IVideoUploadResponse {
    videoId: string;          // The video's unique identifier (_id)
    title: string;            // Title of the uploaded video
    status: 'pending' | 'processing' | 'ready'; // Initial status
  }