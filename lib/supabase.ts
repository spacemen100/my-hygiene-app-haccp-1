import { createClient } from '@supabase/supabase-js'

// Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Vérification que les variables d'environnement sont définies
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

// Configuration du client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuration de l'authentification
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Optionnel : configuration des redirections
    // flowType: 'pkce'
  },
  // Configuration de la base de données
  db: {
    schema: 'public'
  },
  // Configuration globale
  global: {
    headers: {
      'x-my-custom-header': 'my-hygiene-app'
    }
  }
})

// Export du type Database pour TypeScript (optionnel)
// Vous pouvez générer ce type avec la CLI Supabase : npx supabase gen types typescript
export type Database = any // Remplacez par votre type de base de données généré

// Helper functions pour l'authentification
export const auth = {
  // Inscription
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Connexion
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Déconnexion
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Écouter les changements d'état d'authentification
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions pour la base de données
export const db = {
  // Sélectionner des données
  select: (table: string) => supabase.from(table).select(),
  
  // Insérer des données
  insert: (table: string, data: any) => supabase.from(table).insert(data),
  
  // Mettre à jour des données
  update: (table: string, data: any) => supabase.from(table).update(data),
  
  // Supprimer des données
  delete: (table: string) => supabase.from(table).delete(),
}

// Helper functions pour le stockage de fichiers
export const storage = {
  // Uploader un fichier
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)
    return { data, error }
  },

  // Télécharger un fichier
  download: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    return { data, error }
  },

  // Obtenir l'URL publique d'un fichier
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }
}

// Export par défaut du client Supabase
export default supabase