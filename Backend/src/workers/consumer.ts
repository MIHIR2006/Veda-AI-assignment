import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { io } from '../index.js';
import dotenv from 'dotenv';
import { Assignment } from '../models/Assignment.js';

dotenv.config();

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const worker = new Worker(
  'PaperGenerationQueue',
  async (job) => {
    const { topic, marks, difficulty, questionTypes, instructions, jobId, imageBase64, mimeType } = job.data;
    
    try {
      console.log(`Processing AI job ${jobId} for topic: ${topic}`);
      if (imageBase64) {
        console.log(`Job ${jobId} includes visual lesson notes!`);
      }
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
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
      
      let finalPrompt: any = prompt;
      
      if (imageBase64 && mimeType) {
        const base64DataStr = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        
        finalPrompt = [
          prompt + "\n\nCRITICAL: Please strictly use the attached lesson notes image as context to generate your questions.",
          { inlineData: { data: base64DataStr, mimeType } }
        ];
      }
      
      const result = await model.generateContent(finalPrompt);
      const outputText = result.response.text();
      
      const paperData = JSON.parse(outputText);
      
      await Assignment.findOneAndUpdate(
        { jobId: jobId },
        { status: 'completed', paper: paperData }
      );
      
      io.to(jobId).emit('AI_COMPLETE', { paperData, jobId });
      console.log(`Successfully completed and emitted results for job ${jobId}`);
      await redisConnection.del('assignments_list');
      
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      
      await Assignment.findOneAndUpdate(
        { jobId: jobId },
        { status: 'failed' }
      );
      
      io.to(jobId).emit('AI_ERROR', { error: 'Failed to generate question paper' });
      await redisConnection.del('assignments_list');
      throw error;
    }
  },
  { connection: redisConnection as any }
);

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs on PaperGenerationQueue');
});

worker.on('error', (err) => {
  console.error('Worker encountered an error:', err);
});
