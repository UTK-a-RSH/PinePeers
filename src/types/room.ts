
export interface IRoom {
    _id: string;              // MongoDB-generated unique identifier
    name: string;             // Name of the room
    hostId: string;           // Unique identifier for the host
    users: string[];          // Array of user identifiers (e.g., socket IDs)
    currentVideo: string | null; // HLS URL of the current video/stream, or null if none
    createdAt: Date;          // Timestamp of room creation
  }




  export interface IRoomCreateRequest {
    name: string;             
  }
  
  


  export interface IRoomCreateResponse {
    roomId: string;           // The room's unique identifier (_id)
    hostId: string;           // The host's unique identifier
    link: string;             // Shareable link to join the room (e.g., /room/<_id>)
  }