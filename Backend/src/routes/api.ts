import { Router } from 'express';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Connect to Redis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize BullMQ Queue
export const paperQueue = new Queue('PaperGenerationQueue', { connection: redisConnection });

router.post('/generate-paper', async (req, res) => {
  try {
    const { topic, marks, difficulty, questionTypes, instructions } = req.body;
    
    // Generate a unique jobId
    const jobId = uuidv4();
    
    // Add a job to the queue containing the body payload + jobId
    await paperQueue.add(
      'generate-paper',
      { topic, marks, difficulty, questionTypes, instructions, jobId },
      { jobId } // Pass the jobId as the BullMQ job ID option
    );
    
    // Return a 202 Accepted response containing message and jobId
    res.status(202).json({ message: 'Job queued', jobId });
  } catch (error) {
    console.error('Error queuing job:', error);
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

export default router;
