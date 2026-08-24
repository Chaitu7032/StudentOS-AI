export type LearningMode =
  | "beginner"
  | "revision"
  | "interview"
  | "deep_dive"
  | "exam_prep"
  | "visual";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Chat {
  id: string;
  title: string;
  learning_mode: LearningMode;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatDetail extends Chat {
  messages: Message[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  file_type: string | null;
  chunk_count: number;
  created_at: string;
}

export interface Citation {
  index: number;
  document_id: string;
  document_title: string;
  chunk_index: number;
  snippet: string;
  score: number;
  page?: number;
  url?: string;
}

export interface KnowledgeStats {
  document_count: number;
  chunk_count: number;
}

export const LEARNING_MODES: {
  id: LearningMode;
  label: string;
  description: string;
}[] = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Intuitive analogies & fundamental concepts",
  },
  {
    id: "revision",
    label: "Revision",
    description: "High-yield summaries & exam checkpoints",
  },
  {
    id: "interview",
    label: "Interview",
    description: "Technical problem walkthroughs & STAR tips",
  },
  {
    id: "deep_dive",
    label: "Deep Dive",
    description: "Rigorous internals & architecture",
  },
  {
    id: "exam_prep",
    label: "Exam Prep",
    description: "Step-by-step solutions & test strategies",
  },
  {
    id: "visual",
    label: "Visual",
    description: "Flowcharts & architectural diagrams",
  },
];
