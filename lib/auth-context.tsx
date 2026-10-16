'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { insforge } from '@/lib/insforge';

export type InsForgeProfile = {
  name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  bio?: string;
  [key: string]: unknown;
};

export type User = {
  id: string;
  email: string;
  emailVerified: boolean;
  providers?: string[];
  createdAt?: string;
  updatedAt?: string;
  profile?: InsForgeProfile | null;
  metadata?: Record<string, unknown> | null;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => ({ data: null, error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await insforge.auth.getCurrentUser();
      const currentUser = data?.user ?? null;
      setUser(currentUser);

      // Save / sync user to public.users table in InsForge database
      if (currentUser?.id && currentUser?.email) {
        try {
          await insforge.database.from('users').upsert([
            {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.profile?.name || currentUser.email.split('@')[0],
              avatar_url: currentUser.profile?.avatar_url || currentUser.profile?.avatarUrl || null,
              bio: (currentUser.profile?.bio as string) || null,
              last_sign_in_at: new Date().toISOString(),
            },
          ]);
        } catch (dbErr) {
          console.warn('Database user sync note:', dbErr);
        }
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signOut = async () => {
    await insforge.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (profileData: Record<string, unknown>) => {
    const res = await insforge.auth.setProfile(profileData);
    if (!res.error) {
      if (user?.id) {
        try {
          await insforge.database
            .from('users')
            .update({
              name: profileData.name,
              bio: profileData.bio,
              avatar_url: profileData.avatar_url || profileData.avatarUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        } catch (dbErr) {
          console.warn('Database profile update note:', dbErr);
        }
      }
      await refreshUser();
    }
    return res as { data: unknown; error: Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
