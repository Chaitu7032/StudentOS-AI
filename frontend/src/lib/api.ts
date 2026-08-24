import type {
  AuthResponse,
  Chat,
  ChatDetail,
  Citation,
  KnowledgeDocument,
  KnowledgeStats,
  LearningMode,
  User,
} from "@/types";
import type {
  LearningMemory,
  LearningProfile,
  ProgressOverview,
  RevisionItem,
  StudyPlan,
  UserTopic,
} from "@/types/progress";
import {
  API_TIMEOUT_MS,
  createAbortSignal,
  parseApiError,
  STREAM_TIMEOUT_MS,
} from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    signal: options.signal ?? createAbortSignal(API_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new ApiError(await parseApiError(res), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  signup: (data: { email: string; full_name: string; password: string }) =>
    request<AuthResponse>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<User>("/api/v1/auth/me", {}, token),

  listChats: (token: string) =>
    request<Chat[]>("/api/v1/chats", {}, token),

  createChat: (
    token: string,
    data?: { title?: string; learning_mode?: LearningMode },
  ) =>
    request<Chat>("/api/v1/chats", {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }, token),

  getChat: (token: string, chatId: string) =>
    request<ChatDetail>(`/api/v1/chats/${chatId}`, {}, token),

  deleteChat: (token: string, chatId: string) =>
    request<void>(`/api/v1/chats/${chatId}`, { method: "DELETE" }, token),

  listDocuments: (token: string) =>
    request<KnowledgeDocument[]>("/api/v1/knowledge/documents", {}, token),

  uploadDocument: async (token: string, file: File, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    const res = await fetch(`${API_URL}/api/v1/knowledge/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: createAbortSignal(60_000),
    });
    if (!res.ok) {
      throw new ApiError(await parseApiError(res), res.status);
    }
    return res.json() as Promise<KnowledgeDocument>;
  },

  uploadTextNote: (
    token: string,
    data: { title: string; content: string },
  ) =>
    request<KnowledgeDocument>("/api/v1/knowledge/documents/text", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  deleteDocument: (token: string, documentId: string) =>
    request<void>(`/api/v1/knowledge/documents/${documentId}`, {
      method: "DELETE",
    }, token),

  knowledgeStats: (token: string) =>
    request<KnowledgeStats>("/api/v1/knowledge/stats", {}, token),

  streamMessage: async function* (
    token: string,
    chatId: string,
    content: string,
    options?: {
      learningMode?: LearningMode;
      useKnowledge?: boolean;
      useWeb?: boolean;
      topicName?: string;
    },
  ): AsyncGenerator<
    { type: "content"; text: string } | { type: "citations"; citations: Citation[] },
    void,
    unknown
  > {
    const res = await fetch(
      `${API_URL}/api/v1/chats/${chatId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          learning_mode: options?.learningMode,
          use_knowledge: options?.useKnowledge ?? false,
          use_web: options?.useWeb ?? false,
          topic_name: options?.topicName,
        }),
        signal: createAbortSignal(STREAM_TIMEOUT_MS),
      },
    );

    if (!res.ok || !res.body) {
      throw new ApiError(await parseApiError(res), res.status);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]" || payload === '"[DONE]"') return;
        try {
          const parsed = JSON.parse(payload) as {
            content?: string;
            citations?: Citation[];
            error?: string;
          };
          if (parsed.error) throw new ApiError(parsed.error, 500);
          if (parsed.citations?.length) {
            yield { type: "citations", citations: parsed.citations };
          }
          if (parsed.content) {
            yield { type: "content", text: parsed.content };
          }
        } catch (e) {
          if (e instanceof ApiError) throw e;
        }
      }
    }
  },

  getProgressOverview: (token: string) =>
    request<ProgressOverview>("/api/v1/progress/overview", {}, token),

  updateProfile: (
    token: string,
    data: { daily_goal_minutes?: number; learning_goal?: string },
  ) =>
    request<LearningProfile>("/api/v1/progress/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  logActivity: (token: string, data?: { minutes?: number; topic_name?: string }) =>
    request<LearningProfile>("/api/v1/progress/activity", {
      method: "POST",
      body: JSON.stringify(data ?? { minutes: 1 }),
    }, token),

  listTopics: (token: string) =>
    request<UserTopic[]>("/api/v1/progress/topics", {}, token),

  createTopic: (
    token: string,
    data: { name: string; category?: string; mastery_score?: number },
  ) =>
    request<UserTopic>("/api/v1/progress/topics", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  updateTopic: (
    token: string,
    id: string,
    data: { mastery_score?: number; practice?: boolean; name?: string },
  ) =>
    request<UserTopic>(`/api/v1/progress/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  deleteTopic: (token: string, id: string) =>
    request<void>(`/api/v1/progress/topics/${id}`, { method: "DELETE" }, token),

  listStudyPlans: (token: string) =>
    request<StudyPlan[]>("/api/v1/progress/study-plans", {}, token),

  generateStudyPlan: (
    token: string,
    data?: { weekly_hours?: number; focus?: string },
  ) =>
    request<StudyPlan>("/api/v1/progress/study-plans/generate", {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }, token),

  completeStudyTask: (token: string, planId: string, taskId: string) =>
    request<StudyPlan>(`/api/v1/progress/study-plans/${planId}/tasks`, {
      method: "PATCH",
      body: JSON.stringify({ task_id: taskId }),
    }, token),

  updatePlanTask: (
    token: string,
    planId: string,
    taskId: string,
    data: { completed: boolean },
  ) =>
    request<StudyPlan>(`/api/v1/progress/study-plans/${planId}/tasks`, {
      method: "PATCH",
      body: JSON.stringify({ task_id: taskId, ...data }),
    }, token),

  listRevisionQueue: (token: string) =>
    request<RevisionItem[]>("/api/v1/progress/revision", {}, token),

  listRevisions: (token: string) =>
    request<RevisionItem[]>("/api/v1/progress/revisions", {}, token),

  createRevision: (
    token: string,
    data: { title: string; scheduled_date: string; topic_id?: string; notes?: string },
  ) =>
    request<RevisionItem>("/api/v1/progress/revisions", {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  completeRevision: (token: string, revisionId: string) =>
    request<RevisionItem>(`/api/v1/progress/revisions/${revisionId}/complete`, {
      method: "PATCH",
    }, token),

  submitRevisionReview: (
    token: string,
    itemId: string,
    data: { rating: 1 | 2 | 3 | 4 | 5 },
  ) =>
    request<RevisionItem>(`/api/v1/progress/revision/${itemId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  listMemories: (token: string) =>
    request<LearningMemory[]>("/api/v1/progress/memory", {}, token),

  addMemory: (token: string, content: string) =>
    request<LearningMemory>("/api/v1/progress/memory", {
      method: "POST",
      body: JSON.stringify({ content }),
    }, token),

  deleteMemory: (token: string, id: string) =>
    request<void>(`/api/v1/progress/memory/${id}`, { method: "DELETE" }, token),
};
