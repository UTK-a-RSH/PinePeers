import mongoose, { Schema, Document } from 'mongoose';
import { IRoom } from '../types/room';

// Create the interface for the document that combines IRoom with Document
interface IRoomDocument extends IRoom, Document {
  _id: string;

}

// Create the schema
const RoomSchema: Schema = new Schema<IRoomDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  hostId: {
    type: String,
    required: true
  },
  users: {
    type: [String],
    default: []
  },
  currentVideo: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
export default mongoose.model<IRoomDocument>('Room', RoomSchema);
