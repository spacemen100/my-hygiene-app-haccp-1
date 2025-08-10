import { createClient } from '@supabase/supabase-js'

// Configuration du client Supabase avec les valeurs directement intégrées
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

// Définissez des interfaces/types appropriés pour remplacer 'any'
interface UserMetadata {
  [key: string]: unknown
}

interface AuthResponse {
  data: {
    user?: {
      id: string
      email?: string
      user_metadata?: UserMetadata
    }
    session?: {
      access_token: string
      refresh_token: string
    }
  }
  error?: Error | null
}

interface AuthCallback {
  (event: string, session: unknown): void
}

// Helper functions pour l'authentification
export const auth = {
  signUp: async (email: string, password: string, metadata?: UserMetadata): Promise<AuthResponse> => {
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

  signOut: async (): Promise<{ error?: Error | null }> => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async (): Promise<{ user: unknown | null; error?: Error | null }> => {
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
  insert: <T = unknown>(table: string, data: T) => supabase.from(table).insert(data),
  update: <T = unknown>(table: string, data: T) => supabase.from(table).update(data),
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

// Export par défaut du client Supabase
export default supabase