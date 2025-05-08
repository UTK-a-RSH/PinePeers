import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db/utils/index';
import { rabbitMQClient } from './config/rabbitmq'; // Import RabbitMQ client
import roomRoutes from './routes/roomRoutes'; 
import cors from 'cors';


dotenv.config();

const app = express();
const port = process.env.PORT || 3000; 


app.use(express.json());

app.use(cors({
origin: ["http://localhost:5000/"],
credentials: true
}))

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Mount the room router
app.use('/api/v1/room', roomRoutes);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Connect to Database and RabbitMQ concurrently
    await Promise.all([
      connectDB(),
      rabbitMQClient.connect() 
    ]);
    
    console.log("Database and RabbitMQ connected successfully.");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize services. Server not started.", error);
    process.exit(1); // Exit if essential services fail to connect
  }
};

startServer();
