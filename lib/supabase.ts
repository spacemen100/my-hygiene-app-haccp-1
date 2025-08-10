import { createClient } from '@supabase/supabase-js'
import { Database } from '@/src/types/database' // path to your generated file

export const supabase = createClient<Database>(
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
