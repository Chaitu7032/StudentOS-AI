export interface LearningProfile {
  study_streak: number;
  longest_streak: number;
  total_study_minutes: number;
  daily_goal_minutes: number;
  learning_goal: string | null;
  last_active_date: string | null;
  today_minutes: number;
}

export interface UserTopic {
  id: string;
  name: string;
  category: string;
  mastery_score: number;
  practice_count: number;
  last_practiced_at: string | null;
  is_weak: boolean;
  notes: string | null;
  created_at: string;
}

export interface StudyTask {
  id: string;
  title: string;
  topic: string;
  duration_minutes: number;
  due_date: string;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  plan_data: {
    tasks: StudyTask[];
    weekly_hours?: number;
    focus_areas?: string[];
  };
  ai_generated: boolean;
  created_at: string;
  progress_percent: number;
}

export interface RevisionItem {
  id: string;
  title: string;
  topic_id: string | null;
  topic_name: string | null;
  scheduled_date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface LearningMemory {
  id: string;
  content: string;
  source: string;
  created_at: string;
}

export interface ProgressOverview {
  profile: LearningProfile;
  total_chats: number;
  total_messages: number;
  topics_count: number;
  weak_topics_count: number;
  documents_count: number;
  recommendations: string[];
  upcoming_revisions: RevisionItem[];
}
