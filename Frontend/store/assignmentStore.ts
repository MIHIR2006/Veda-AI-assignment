import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getSession } from 'next-auth/react';

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
  dueDate?: string;
  jobId: string;
  joinCode?: string;
  status: 'pending' | 'completed' | 'failed';
  paper?: PaperData;
  userId?: string;
  isPublic?: boolean;
  sharedWithGroups?: string[];
  createdAt: string;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  const token = (session as any)?.user?.accessToken;
  
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

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
  deleteAssignment: (id: string) => Promise<boolean>;
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
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/assignments`, { headers });
      const data = await res.json();
      set({ assignments: data, loadingAssignments: false });
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      set({ loadingAssignments: false });
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}/api/assignments/${id}`, { 
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        set((state) => ({ assignments: state.assignments.filter(a => a._id !== id) }));
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  startJob: (jobId: string) => {
    const state = get();
    
    // Prevent overwriting if the socket already marked this job as completed or it's currently generating
    if (state.activeJobId === jobId && (state.status === 'generating' || state.status === 'completed')) {
      if (!state.socket) {
        state.initializeSocket();
      } else {
        state.socket.emit('joinJobRoom', jobId);
      }
      return;
    }

    set({
      activeJobId: jobId,
      status: 'generating',
      generatedPaper: null,
      error: null
    });
    
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
    if (get().socket) return;
    
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');
    
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