import mongoose, { Schema, Document } from 'mongoose';

interface IEvaluatedAnswer {
  questionText: string;
  studentAnswer: string;
  feedback: string;
  marksAwarded: number;
}

export interface ISubmission extends Document {
  assignmentId: string;
  userId: string;
  studentName: string;
  answers: { [key: string]: string };
  status: 'pending' | 'evaluated' | 'failed';
  totalMarksAwarded?: number;
  overallFeedback?: string;
  weakTopics?: string[];
  detailedFeedback?: IEvaluatedAnswer[];
  createdAt: Date;
  updatedAt: Date;
}

const EvaluatedAnswerSchema: Schema = new Schema({
  questionText: { type: String, required: true },
  studentAnswer: { type: String },
  feedback: { type: String, required: true },
  marksAwarded: { type: Number, required: true }
});

const SubmissionSchema: Schema = new Schema(
  {
    assignmentId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    studentName: { type: String, required: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['pending', 'evaluated', 'failed'],
      default: 'pending'
    },
    totalMarksAwarded: { type: Number },
    overallFeedback: { type: String },
    weakTopics: [{ type: String }],
    detailedFeedback: [EvaluatedAnswerSchema]
  },
  { timestamps: true }
);

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
