import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api.js';
import { connectDB } from './config/db.js';

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Initialize CORS and JSON parsing
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

// Set up Socket.io server
export const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Listen for joinJobRoom event
  socket.on('joinJobRoom', (jobId: string) => {
    socket.join(jobId);
    console.log(`Socket ${socket.id} joined room ${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Use API routes
app.use('/api', apiRoutes);

// Import consumer to start the BullMQ worker
import './workers/consumer.js';

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
