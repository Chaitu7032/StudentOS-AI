import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (hydrated: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "studentos-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (!state) {
          useAuthStore.setState({ hasHydrated: true });
        }
      },
    },
  ),
);
