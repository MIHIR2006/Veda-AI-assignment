import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { io } from '../index.js';
import dotenv from 'dotenv';
import { Assignment } from '../models/Assignment.js';

dotenv.config();

// Connect to Redis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

// Initialize GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Create BullMQ Worker
const worker = new Worker(
  'PaperGenerationQueue',
  async (job) => {
    // Extract the data
    const { topic, marks, difficulty, questionTypes, instructions, jobId } = job.data;
    
    try {
      console.log(`Processing AI job ${jobId} for topic: ${topic}`);
      
      // Configure the Gemini model
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      // Write strict prompt demanding exact JSON structure
      const prompt = `
        You are an expert educator. Create an exam paper matching the following criteria:
        - Topic: ${topic}
        - Total Marks: ${marks}
        - Difficulty: ${difficulty}
        - Question Types: ${questionTypes ? questionTypes.join(', ') : 'Mixed'}
        - Instructions: ${instructions || 'None'}
        
        You must return raw JSON matching exactly this structure:
        {
          "sections": [
            {
              "title": "String",
              "instructions": "String",
              "questions": [
                {
                  "text": "String",
                  "marks": 0,
                  "difficulty": "Easy|Moderate|Hard"
                }
              ]
            }
          ]
        }
      `;
      
      // Await AI generation
      const result = await model.generateContent(prompt);
      const outputText = result.response.text();
      
      // Parse JSON text to validate before emitting
      const paperData = JSON.parse(outputText);
      
      // Update Database
      await Assignment.findOneAndUpdate(
        { jobId: jobId },
        { status: 'completed', paper: paperData }
      );
      
      // Emit the result to the specific WebSocket room
      io.to(jobId).emit('AI_COMPLETE', { paperData, jobId });
      console.log(`Successfully completed and emitted results for job ${jobId}`);
      
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      
      // Update Database with failure
      await Assignment.findOneAndUpdate(
        { jobId: jobId },
        { status: 'failed' }
      );
      
      // Emit error event to the room
      io.to(jobId).emit('AI_ERROR', { error: 'Failed to generate question paper' });
      throw error;
    }
  },
  { connection: redisConnection }
);

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs on PaperGenerationQueue');
});

worker.on('error', (err) => {
  console.error('Worker encountered an error:', err);
});
