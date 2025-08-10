import { createClient, User, Session } from '@supabase/supabase-js'

// Configuration du client Supabase
export const supabase = createClient(
  'https://wtxsyzdksnbftlckojuz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0eHN5emRrc25iZnRsY2tvanV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTk0NTksImV4cCI6MjA3MDE5NTQ1OX0.PVuWcjTvF7GNgfpjgqXLLM7HvH_evWsklvB0In1kNsc',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-my-custom-header': 'my-hygiene-app'
      }
    }
  }
)

// Types pour l'authentification
interface AuthResponse {
  data: {
    user: User | null
    session: Session | null
  }
  error: Error | null
}

interface UserResponse {
  user: User | null
  error: Error | null
}

interface AuthCallback {
  (event: string, session: Session | null): void
}

// Helper functions pour l'authentification
export const auth = {
  signUp: async (email: string, password: string, metadata?: any): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async (): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: AuthCallback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions pour la base de données
export const db = {
  select: (table: string) => supabase.from(table).select(),
  insert: <T = any>(table: string, data: T) => supabase.from(table).insert(data),
  update: <T = any>(table: string, data: T) => supabase.from(table).update(data),
  delete: (table: string) => supabase.from(table).delete(),
}

// Helper functions pour le stockage de fichiers
export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    return { data, error }
  },

  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    return { data, error }
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }
}

export default supabase