import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtxsyzdksnbftlckojuz.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0eHN5emRrc25iZnRsY2tvanV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTk0NTksImV4cCI6MjA3MDE5NTQ1OX0.PVuWcjTvF7GNgfpjgqXLLM7HvH_evWsklvB0In1kNsc'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
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
