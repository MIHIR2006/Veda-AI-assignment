import { Router } from 'express';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/Assignment.js';

const router = Router();

// Connect to Redis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

// Initialize BullMQ Queue
export const paperQueue = new Queue('PaperGenerationQueue', { connection: redisConnection });

// CREATE: Generate a new paper
router.post('/generate-paper', async (req, res) => {
  try {
    const { topic, marks, difficulty, questionTypes, instructions, imageBase64, mimeType } = req.body;
    
    // Generate a unique jobId
    const jobId = uuidv4();
    
    // Create DB entry
    const assignment = new Assignment({
      topic,
      marks,
      difficulty,
      questionTypes: questionTypes || [],
      instructions,
      jobId,
      status: 'pending'
    });
    
    await assignment.save();
    
    // Add a job to the queue containing the body payload + jobId
    await paperQueue.add(
      'generate-paper',
      { topic, marks, difficulty, questionTypes, instructions, jobId, imageBase64, mimeType },
      { jobId } // Pass the jobId as the BullMQ job ID option
    );
    
    // Return a 202 Accepted response containing message and jobId
    res.status(202).json({ message: 'Job queued', jobId, assignmentId: assignment._id });
  } catch (error) {
    console.error('Error queuing job:', error);
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

// READ: Get all assignments
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// READ: Get a single assignment by ID
router.get('/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// DELETE: Delete an assignment
router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
