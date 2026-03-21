import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  topic: string;
  marks: number;
  difficulty: string;
  questionTypes: string[];
  instructions?: string;
  dueDate?: Date;
  jobId: string;
  status: 'pending' | 'completed' | 'failed';
  paper?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema(
  {
    topic: { type: String, required: true },
    marks: { type: Number, required: true },
    difficulty: { type: String, required: true },
    questionTypes: [{ type: String }],
    instructions: { type: String },
    dueDate: { type: Date },
    jobId: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    },
    paper: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
