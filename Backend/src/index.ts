import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api.js';
import { connectDB } from './config/db.js';

connectDB();

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

export const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinJobRoom', (jobId: string) => {
    socket.join(jobId);
    console.log(`Socket ${socket.id} joined room ${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use('/api', apiRoutes);

import './workers/consumer.js';

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
