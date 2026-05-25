import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KnowledgeState {
  useKnowledge: boolean;
  setUseKnowledge: (value: boolean) => void;
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set) => ({
      useKnowledge: false,
      setUseKnowledge: (value) => set({ useKnowledge: value }),
    }),
    { name: "studentos-knowledge" },
  ),
);
