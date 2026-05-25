import { create } from "zustand";
import type { LearningMode } from "@/types";

interface ChatState {
  activeMode: LearningMode;
  setActiveMode: (mode: LearningMode) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeMode: "beginner",
  setActiveMode: (mode) => set({ activeMode: mode }),
}));
