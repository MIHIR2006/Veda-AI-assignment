import { Router } from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/Assignment.js';
import { User } from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { SignJWT, jwtVerify } from 'jose';

const router = Router();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export const paperQueue = new Queue('PaperGenerationQueue', { connection: redisConnection as any });

async function createToken(userId: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
}

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, schoolName } = req.body;
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const user = new User({ email, password, name, schoolName });
    await user.save();

    const token = await createToken(user._id.toString(), user.email);

    res.status(201).json({ 
      message: 'User created successfully', 
      token,
      userId: user._id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/auth/oauth', async (req, res) => {
  try {
    const { email, name } = req.body;
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      const randomPassword = uuidv4();
      user = new User({ 
        email: email.toLowerCase(), 
        name: name || email.split('@')[0], 
        password: randomPassword, 
        schoolName: 'OAuth User' 
      });
      await user.save();
    }

    const token = await createToken(user._id.toString(), user.email);

    res.json({ 
      userId: user._id, 
      email: user.email, 
      name: user.name,
      token 
    });
  } catch (error) {
    console.error('Error in OAuth verification:', error);
    res.status(500).json({ error: 'Failed to verify oauth user' });
  }
});

router.post('/auth/verify', async (req, res) => {
  try {
    const { email, password, action } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = await createToken(user._id.toString(), user.email);

    res.json({ 
      userId: user._id, 
      email: user.email, 
      name: user.name,
      token 
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify credentials' });
  }
});

router.post('/generate-paper', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { topic, marks, difficulty, questionTypes, instructions, imageBase64, mimeType, dueDate } = req.body;
    const userId = req.user?.userId;
    
    const jobId = uuidv4();
    
    const assignment = new Assignment({
      topic,
      marks,
      difficulty,
      questionTypes: questionTypes || [],
      instructions,
      dueDate,
      jobId,
      status: 'pending',
      userId
    });
    
    await assignment.save();
    
    await paperQueue.add(
      'generate-paper',
      { topic, marks, difficulty, questionTypes, instructions, dueDate, jobId, imageBase64, mimeType, userId },
      { jobId }
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
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (e) {
        // Invalid token, continue without userId
      }
    }

    const cached = await redisConnection.get('assignments_list');
    if (cached) {
      let assignments = JSON.parse(cached);
      if (userId) {
        assignments = assignments.filter((a: any) => !a.userId || a.userId === userId);
      }
      res.json(assignments);
      return;
    }

    let assignments = await Assignment.find().sort({ createdAt: -1 });
    
    if (userId) {
      assignments = assignments.filter((a: any) => !a.userId || a.userId === userId);
    }
    
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

router.delete('/assignments/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    // Check ownership - allow if no userId (backward compat) or matches
    if (assignment.userId && assignment.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized to delete this assignment' });
      return;
    }
    
    await Assignment.findByIdAndDelete(req.params.id);
    await redisConnection.del('assignments_list');
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

router.post('/assignments/:id/regenerate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    if (assignment.userId && assignment.userId !== req.user?.userId) {
      res.status(403).json({ error: 'Not authorized to regenerate this assignment' });
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
        jobId: newJobId,
        userId: assignment.userId
      },
      { job: newJobId }
    );
    
    res.status(202).json({ message: 'Regeneration queued', jobId: newJobId });
  } catch (error) {
    console.error('Error regenerating:', error);
    res.status(500).json({ error: 'Failed to regenerate job' });
  }
});

export default router;