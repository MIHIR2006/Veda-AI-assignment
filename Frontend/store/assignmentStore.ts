import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type QuestionData = {
  text: string;
  marks: number;
  difficulty: "Easy" | "Moderate" | "Hard" | "Medium";
};

export type SectionData = {
  title: string;
  instructions: string;
  questions: QuestionData[];
};

export type PaperData = {
  sections: SectionData[];
};

export type AssignmentData = {
  _id: string;
  topic: string;
  marks: number;
  difficulty: string;
  questionTypes: string[];
  instructions?: string;
  jobId: string;
  status: 'pending' | 'completed' | 'failed';
  paper?: PaperData;
  createdAt: string;
};

export type AssignmentState = {
  assignments: AssignmentData[];
  activeJobId: string | null;
  generatedPaper: PaperData | null;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  loadingAssignments: boolean;
  error: string | null;
  socket: Socket | null;
  
  fetchAssignments: () => Promise<void>;
  startJob: (jobId: string) => void;
  resetJob: () => void;
  initializeSocket: () => void;
  disconnectSocket: () => void;
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  activeJobId: null,
  generatedPaper: null,
  status: 'idle',
  loadingAssignments: false,
  error: null,
  socket: null,

  fetchAssignments: async () => {
    set({ loadingAssignments: true });
    try {
      const res = await fetch('http://localhost:8080/api/assignments');
      const data = await res.json();
      set({ assignments: data, loadingAssignments: false });
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      set({ loadingAssignments: false });
    }
  },

  startJob: (jobId: string) => {
    set({
      activeJobId: jobId,
      status: 'generating',
      generatedPaper: null,
      error: null
    });
    
    // Auto initiate socket subscription
    const state = get();
    if (state.socket) {
      state.socket.emit('joinJobRoom', jobId);
      console.log(`Joined job room: ${jobId}`);
    } else {
      state.initializeSocket();
    }
  },

  resetJob: () => {
    set({ activeJobId: null, generatedPaper: null, status: 'idle', error: null });
  },

  initializeSocket: () => {
    // Only connect if not already connected
    if (get().socket) return;
    
    const socket = io('http://localhost:8080');
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      const { activeJobId } = get();
      if (activeJobId) {
        socket.emit('joinJobRoom', activeJobId);
      }
    });

    socket.on('AI_COMPLETE', (payload: { paperData: PaperData, jobId: string }) => {
      const { activeJobId } = get();
      if (payload.jobId === activeJobId) {
        set({
          generatedPaper: payload.paperData,
          status: 'completed',
        });
      }
    });

    socket.on('AI_ERROR', (payload: { error: string }) => {
      set({
        status: 'failed',
        error: payload.error
      });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
