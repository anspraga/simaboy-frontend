import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'login' | 'admin' | 'guru' | 'siswa' | 'siswa_exam';

interface AuthState {
  role: Role;
  user: string;
  token: string;
  teacherId?: number;
  setAuth: (role: Role, user: string, token: string, teacherId?: number) => void;
  clearAuth: () => void;
  setRole: (role: Role) => void;
  logout: (apiUrl: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set: any, get: any) => ({
      role: 'login' as Role,
      user: '',
      token: '',
      setAuth: (role: Role, user: string, token: string, teacherId?: number) => set({ role, user, token, teacherId }),
      clearAuth: () => set({ role: 'login', user: '', token: '', teacherId: undefined }),
      setRole: (role: Role) => set({ role }),
      logout: async (apiUrl: string) => {
        const { user } = get();
        try {
          if (user) {
            // Kita bisa juga menggunakan jwt token di header jika API logout butuh JWT
            await fetch(`${apiUrl}/api/auth/logout?username=${user}`);
          }
        } catch (e) {
          console.error("Logout error:", e);
        }
        set({ role: 'login', user: '', token: '' });
      }
    }),
    {
      name: 'simaboy-auth',
    }
  )
);
