import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LoginResponse } from "~/services/api";

interface AuthUser {
  userId: string;
  email: string;
  username: string;
  role: string;
  profileImageUrl: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  saveSession: (data: LoginResponse) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

// SSR-safe storage: devuelve noop en servidor, localStorage en cliente
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
      token: null,
      user: null,

      saveSession: (data: LoginResponse) => {
        const { token, ...user } = data;
        set({ token, user });
      },

      clearSession: () => set({ token: null, user: null }),

      isAuthenticated: () => !!get().token,
    }),
    {
      name: "finz-auth",
      storage: safeStorage,
    }
  )
);
