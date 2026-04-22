import { Router } from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../models/Assignment.js';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';
import { Group } from '../models/Group.js';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { SignJWT, jwtVerify } from 'jose';

const router = Router();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

export const paperQueue = new Queue('PaperGenerationQueue', { connection: redisConnection as any });
export const evaluationQueue = new Queue('EvaluationQueue', { connection: redisConnection as any });

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
    const joinCode = uuidv4().slice(0, 6).toUpperCase();
    
    const assignment = new Assignment({
      topic,
      marks,
      difficulty,
      questionTypes: questionTypes || [],
      instructions,
      dueDate,
      jobId,
      joinCode,
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

    let userGroupIds: string[] = [];
    if (userId) {
      const userGroups = await Group.find({ members: userId });
      userGroupIds = userGroups.map(g => g._id.toString());
    }

    const cached = await redisConnection.get('assignments_list');
    if (cached) {
      let assignments = JSON.parse(cached);
      if (userId) {
        assignments = assignments.filter((a: any) => 
          !a.userId || a.userId === userId || a.isPublic || (a.sharedWithGroups && a.sharedWithGroups.some((gid: string) => userGroupIds.includes(gid)))
        );
      } else {
        assignments = assignments.filter((a: any) => !a.userId || a.isPublic);
      }
      res.json(assignments);
      return;
    }

    let assignments = await Assignment.find().sort({ createdAt: -1 });
    
    // Save all to cache, filtering happens at retrieval
    await redisConnection.set('assignments_list', JSON.stringify(assignments), 'EX', 300);
    
    if (userId) {
      assignments = assignments.filter((a: any) => 
        !a.userId || a.userId === userId || a.isPublic || (a.sharedWithGroups && a.sharedWithGroups.some((gid: string) => userGroupIds.includes(gid)))
      );
    } else {
      assignments = assignments.filter((a: any) => !a.userId || a.isPublic);
    }
    
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
    
    // Extract userId manually (since route is conditionally public)
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (e) {}
    }

    // Determine access logic
    let hasAccess = false;
    if (assignment.isPublic || !assignment.userId) {
      hasAccess = true;
    } else if (userId) {
      if (assignment.userId === userId) {
        hasAccess = true;
      } else if (assignment.sharedWithGroups && assignment.sharedWithGroups.length > 0) {
        const userGroups = await Group.find({ members: userId });
        const userGroupIds = userGroups.map(g => g._id.toString());
        hasAccess = assignment.sharedWithGroups.some(groupId => userGroupIds.includes(groupId));
      }
    }

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied: This assignment is private or you do not have permission to view it.' });
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
      { jobId: newJobId }
    );
    
    res.status(202).json({ message: 'Regeneration queued', jobId: newJobId });
  } catch (error) {
    console.error('Error regenerating:', error);
    res.status(500).json({ error: 'Failed to regenerate job' });
  }
});

// --- Groups API ---

router.post('/groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user!.userId;
    const inviteCode = uuidv4().slice(0, 8).toUpperCase();
    
    const group = new Group({
      name,
      description,
      ownerId,
      members: [ownerId],
      inviteCode
    });
    
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/groups', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const groups = await Group.find({ members: userId }).sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/groups/join', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user!.userId;
    
    const group = await Group.findOne({ inviteCode });
    if (!group) {
      res.status(404).json({ error: 'Invalid invite code' });
      return;
    }
    
    if (group.members.includes(userId)) {
      res.status(400).json({ error: 'Already a member of this group' });
      return;
    }
    
    group.members.push(userId);
    await group.save();
    
    res.json({ message: 'Successfully joined group', group });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

router.get('/groups/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }
    
    if (!group.members.includes(userId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Fetch assignments shared with this group
    const assignments = await Assignment.find({ sharedWithGroups: group._id?.toString() }).sort({ createdAt: -1 });
    
    res.json({ group, assignments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

router.delete('/groups/:id/members/:memberId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { id, memberId } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (group.ownerId !== userId) {
      res.status(403).json({ error: 'Only the group owner can remove members' });
      return;
    }

    if (group.ownerId === memberId) {
      res.status(400).json({ error: 'Owner cannot be removed from the group' });
      return;
    }

    group.members = group.members.filter(m => m !== memberId);
    await group.save();

    res.json({ message: 'Member removed successfully', group });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

router.post('/assignments/:id/share', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { groupId, isPublic } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    
    if (assignment.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the owner can modify sharing for this assignment' });
      return;
    }
    
    const updateField: any = {};
    const updateAction: any = { $set: updateField };

    // Update public flag if provided
    if (typeof isPublic === 'boolean') {
      updateField.isPublic = isPublic;
    }
    
    // Update group sharing if provided
    if (groupId) {
      updateAction.$addToSet = { sharedWithGroups: groupId };
    }
    
    const queryPayload = Object.keys(updateAction.$set).length > 0 
      ? updateAction 
      : { $addToSet: updateAction.$addToSet };

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      queryPayload,
      { new: true }
    );
    
    await redisConnection.del('assignments_list');
    
    res.json({ message: 'Assignment sharing updated successfully', assignment: updatedAssignment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share assignment' });
  }
});

// --- Submissions & Analytics API ---

router.get('/assignments/join/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const assignment = await Assignment.findOne({ joinCode: code.toUpperCase() });
    
    if (!assignment) {
      res.status(404).json({ error: 'Invalid join code' });
      return;
    }
    
    // Determine if student has already submitted
    const authHeader = req.headers.authorization;
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (e) {}
    }

    if (userId) {
      const existingSubmission = await Submission.findOne({ assignmentId: assignment._id.toString(), userId });
      if (existingSubmission) {
        res.status(400).json({ error: 'You have already submitted this test.', submissionId: existingSubmission._id });
        return;
      }
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join test' });
  }
});

router.post('/submissions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { assignmentId, studentName, answers } = req.body;
    const userId = req.user!.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const existingSubmission = await Submission.findOne({ assignmentId, userId });
    if (existingSubmission) {
      res.status(400).json({ error: 'You have already submitted this test.' });
      return;
    }

    const submission = new Submission({
      assignmentId,
      userId,
      studentName,
      answers,
      status: 'pending'
    });

    await submission.save();

    await evaluationQueue.add(
      'evaluate-submission',
      { submissionId: submission._id, assignmentId: assignment._id },
      { jobId: submission._id.toString() }
    );

    res.status(201).json({ message: 'Submission queued for evaluation', submissionId: submission._id });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

router.get('/submissions/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const submissions = await Submission.find({ userId }).sort({ createdAt: -1 });

    const populatedSubmissions = await Promise.all(submissions.map(async (sub) => {
      const assignment = await Assignment.findById(sub.assignmentId);
      return {
        id: sub._id,
        assignmentId: sub.assignmentId,
        topic: assignment ? assignment.topic : 'Unknown Topic',
        status: sub.status,
        totalMarks: sub.totalMarksAwarded,
        maxMarks: assignment ? assignment.marks : 0,
        submittedAt: sub.createdAt
      };
    }));

    res.json(populatedSubmissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.get('/submissions/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== req.user!.userId) {
      // Check if user is the teacher who created the assignment
      const assignment = await Assignment.findById(submission.assignmentId);
      if (!assignment || assignment.userId !== req.user!.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
});

router.post('/submissions/:id/reevaluate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const submissionId = req.params.id;
    const userId = req.user!.userId;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    submission.status = 'pending';
    await submission.save();

    await evaluationQueue.add(
      'evaluate-submission',
      { submissionId: submission._id, assignmentId: submission.assignmentId },
      { jobId: submission._id.toString() }
    );

    res.json({ message: 'Submission queued for re-evaluation' });
  } catch (error) {
    console.error('Error re-evaluating submission:', error);
    res.status(500).json({ error: 'Failed to re-evaluate submission' });
  }
});

router.get('/assignments/:id/analytics', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    if (assignment.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const submissions = await Submission.find({ assignmentId }).sort({ createdAt: -1 });

    const totalAttempts = submissions.length;
    const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated');
    const evaluatedAttempts = evaluatedSubmissions.length;
    
    let totalScore = 0;
    const weakTopicsMap: { [key: string]: number } = {};

    evaluatedSubmissions.forEach(sub => {
      totalScore += (sub.totalMarksAwarded || 0);
      if (sub.weakTopics) {
        sub.weakTopics.forEach(topic => {
          weakTopicsMap[topic] = (weakTopicsMap[topic] || 0) + 1;
        });
      }
    });

    const averageScore = evaluatedAttempts > 0 ? (totalScore / evaluatedAttempts) : 0;
    
    const commonWeakTopics = Object.entries(weakTopicsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    const mappedSubmissions = submissions.map(sub => ({
      id: sub._id,
      studentName: sub.studentName,
      status: sub.status,
      score: sub.totalMarksAwarded,
      submittedAt: sub.createdAt
    }));

    res.json({
      totalAttempts,
      evaluatedAttempts,
      averageScore,
      commonWeakTopics,
      submissions: mappedSubmissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;