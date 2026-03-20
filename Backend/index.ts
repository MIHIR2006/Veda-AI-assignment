import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. Setup CORS for Next.js Frontend
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// 2. Initialize WebSockets
export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`Frontend connected via WebSocket: ${socket.id}`);
  
  // The frontend will join a room named after their specific 'jobId'
  socket.on('joinJobRoom', (jobId: string) => {
    socket.join(jobId);
    console.log(`Socket ${socket.id} joined room for Job: ${jobId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// 3. Basic Health Route
app.get('/', (req, res) => {
  res.send('VedaAI Backend is running smoothly.');
});

// We will import our API routes here in the next step!

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});