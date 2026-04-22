import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { io } from '../index.js';
import dotenv from 'dotenv';
import { Submission } from '../models/Submission.js';
import { Assignment } from '../models/Assignment.js';

dotenv.config();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const worker = new Worker(
  'EvaluationQueue',
  async (job) => {
    const { submissionId, assignmentId } = job.data;

    try {
      console.log(`Processing evaluation job for submission: ${submissionId}`);

      const submission = await Submission.findById(submissionId);
      const assignment = await Assignment.findById(assignmentId);

      if (!submission || !assignment) {
        throw new Error('Submission or assignment not found');
      }

      let questionContext = '';
      let totalMaxMarks = 0;
      const questionMap: any = {};

      let qIndex = 0;
      if (assignment.paper && assignment.paper.sections) {
        assignment.paper.sections.forEach((section: any) => {
          section.questions.forEach((q: any) => {
            questionContext += `Question ${qIndex}: ${q.text} (Marks: ${q.marks})\n`;
            totalMaxMarks += q.marks;
            questionMap[qIndex] = q;
            qIndex++;
          });
        });
      }

      const answersContext = Object.entries(submission.answers)
        .map(([index, ans]) => `Answer to Question ${index}: ${ans}`)
        .join('\n\n');

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        You are an expert educator evaluator. 
        You are evaluating a student's submission for the topic: "${assignment.topic}".
        Total maximum marks for the assignment: ${totalMaxMarks}.

        Here are the questions they were asked:
        ${questionContext}

        Here are the student's answers:
        ${answersContext}

        Evaluate the student's answers strictly but fairly.
        
        You must return raw JSON matching exactly this structure:
        {
          "totalMarksAwarded": number,
          "overallFeedback": "String describing overall performance, strengths, and weaknesses",
          "weakTopics": ["Topic 1", "Topic 2"],
          "detailedFeedback": [
            {
              "questionText": "The actual text of the question",
              "studentAnswer": "The student's answer text",
              "feedback": "Specific feedback for this answer",
              "marksAwarded": number
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const outputText = result.response.text();
      const evaluationData = JSON.parse(outputText);

      submission.status = 'evaluated';
      submission.totalMarksAwarded = evaluationData.totalMarksAwarded;
      submission.overallFeedback = evaluationData.overallFeedback;
      submission.weakTopics = evaluationData.weakTopics;
      submission.detailedFeedback = evaluationData.detailedFeedback;

      await submission.save();

      io.emit(`EVALUATION_COMPLETE_${submissionId}`, { submissionId });
      console.log(`Successfully completed evaluation for submission ${submissionId}`);

    } catch (error) {
      console.error(`Error processing evaluation job ${job.data?.submissionId}:`, error);

      await Submission.findByIdAndUpdate(submissionId, { status: 'failed' });

      io.emit(`EVALUATION_ERROR_${submissionId}`, { error: 'Failed to evaluate submission' });
      throw error;
    }
  },
  { connection: redisConnection as any }
);

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs on EvaluationQueue');
});

worker.on('error', (err) => {
  console.error('Evaluation worker encountered an error:', err);
});
