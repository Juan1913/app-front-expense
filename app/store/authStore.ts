import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LoginResponse } from "~/services/api";

interface AuthUser {
  userId: string;
  email: string;
  username: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  saveSession: (data: LoginResponse) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

const safeStorage = createJSONStorage(() =>
  typeof window !== "undefined"
    ? localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      saveSession: (data: LoginResponse) => {
        set({ user: { userId: data.userId, email: data.email, username: data.username, role: data.role } });
      },

      clearSession: () => set({ user: null }),

      isAuthenticated: () => !!get().user,
    }),
    {
      name: "finz-auth",
      storage: safeStorage,
    }
  )
);
