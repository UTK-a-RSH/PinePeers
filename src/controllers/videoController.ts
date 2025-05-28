import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { CustomError } from '../types/customError';
import { minioClient } from '../config/minio';
import Video from '../db/video.model';
import { rabbitMQClient } from '../config/rabbitmq';

export const uploadVideo = async (req: Request, res: Response) => {
  const { roomId, title, description } = req.body;
  
  // Validate inputs
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    throw new CustomError('Invalid Room ID format', 400);
  }
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new CustomError('Video title is required', 400);
  }
  
  if (!req.file) {
    throw new CustomError('No video file uploaded', 400);
  }
  
  try {
    const file = req.file;
    const bucketName = process.env.MINIO_BUCKET || 'temp';
    const objectKey = `uploads/${roomId}/${uuidv4()}${path.extname(file.originalname)}`;
    
    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, process.env.MINIO_REGION || 'us-east-1');
    }
    
    
    console.log('Uploading video to MinIO...');
    await minioClient.fPutObject(
      bucketName,
      objectKey,
      file.path,
      { 
        'Content-Type': file.mimetype,
        'x-amz-meta-original-name': file.originalname,
        'x-amz-meta-room-id': roomId,
        'x-amz-meta-title': title.trim()
      }
    );
    

    console.log('Generating presigned URL...');
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName, 
      objectKey, 
      24 * 60 * 60 // 24 hours expiry
    );
    
    
    const video = new Video({
      title: title.trim(),
      description: description?.trim(),
      roomId: roomId,
      hlsUrl: null,
      status: 'pending'
    });
    
    const savedVideo = await video.save();
    

    console.log('Sending message to RabbitMQ...');
    const messagePayload = {
      EventName: 's3:ObjectCreated:Put',
      Records: [{
        s3: {
          bucket: { name: bucketName },
          object: { 
            key: objectKey,
            size: file.size
          }
        },
        videoId: savedVideo._id,
        presignedUrl: presignedUrl,
        title: savedVideo.title,
        roomId: roomId
      }]
    };
    
    await rabbitMQClient.publishMessage(messagePayload);
    
    // Step 5: Clean up temporary file
    fs.unlinkSync(file.path);
    
    // Step 6: Return response
    res.status(201).json({
      videoId: savedVideo._id,
      title: savedVideo.title,
      status: savedVideo.status,
      presignedUrl: presignedUrl
    });
    
  } catch (error) {
    console.error('Video upload error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    throw new CustomError('Failed to upload video', 500);
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError('Invalid Video ID format', 400);
  }
  
  const video = await Video.findById(id);
  if (!video) {
    throw new CustomError('Video not found', 404);
  }
  
  res.status(200).json(video);
};

export const getAllVideos = async (req: Request, res: Response) => {
  const { roomId } = req.query;
  
  let query = {};
  if (roomId) {
    if (!mongoose.Types.ObjectId.isValid(roomId as string)) {
      throw new CustomError('Invalid Room ID format', 400);
    }
    query = { roomId: new mongoose.Types.ObjectId(roomId as string) };
  }
  
  const videos = await Video.find(query);
  res.status(200).json(videos);
};