import { Router } from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/Assignment.js';

const router = Router();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export const paperQueue = new Queue('PaperGenerationQueue', { connection: redisConnection as any });

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/generate-paper', async (req, res) => {
  try {
    const { topic, marks, difficulty, questionTypes, instructions, imageBase64, mimeType, dueDate } = req.body;
    
    const jobId = uuidv4();
    
    const assignment = new Assignment({
      topic,
      marks,
      difficulty,
      questionTypes: questionTypes || [],
      instructions,
      dueDate,
      jobId,
      status: 'pending'
    });
    
    await assignment.save();
    
    await paperQueue.add(
      'generate-paper',
      { topic, marks, difficulty, questionTypes, instructions, dueDate, jobId, imageBase64, mimeType },
      { jobId } // Pass the jobId as the BullMQ job ID option
    );
    
    await redisConnection.del('assignments_list');
    
    res.status(202).json({ message: 'Job queued', jobId, assignmentId: assignment._id });
  } catch (error) {
    console.error('Error queuing job:', error);
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    const cached = await redisConnection.get('assignments_list');
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    await redisConnection.set('assignments_list', JSON.stringify(assignments), 'EX', 300);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

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

router.delete('/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    await redisConnection.del('assignments_list');
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

router.post('/assignments/:id/regenerate', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    const newJobId = uuidv4();
    assignment.jobId = newJobId;
    assignment.status = 'pending';
    assignment.paper = undefined;
    await assignment.save();
    
    await redisConnection.del('assignments_list');
    
    await paperQueue.add(
      'generate-paper',
      {
        topic: assignment.topic,
        marks: assignment.marks,
        difficulty: assignment.difficulty,
        questionTypes: assignment.questionTypes,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        jobId: newJobId
      },
      { jobId: newJobId }
    );
    
    res.status(202).json({ message: 'Regeneration queued', jobId: newJobId });
  } catch (error) {
    console.error('Error regenerating:', error);
    res.status(500).json({ error: 'Failed to regenerate job' });
  }
});

export default router;
