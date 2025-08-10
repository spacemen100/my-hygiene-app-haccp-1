// components/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: false,
  signOut: async () => {},
  signInWithEmail: async () => null,
});

export function AuthProvider({
  session: initialSession,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState(initialSession);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      return error.message;
    }

    router.refresh();
    return null;
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut, signInWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);