import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dgkzxadlmiafbegmdxcz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbWlhZmJlZ21keGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTI0OTUsImV4cCI6MjA2OTM2ODQ5NX0.MyYN4cA5pLsKb1uklQRIpX1rEuahBj4DZFcp1ljgvss'

// Configuração Supabase inicializada

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'beautycom-web'
    }
  },
  db: {
    schema: 'public'
  }
})

// Tipos para as tabelas do Beautycom
export interface User {
  id: string
  email: string
  name: string
  user_type: 'usuario' | 'profissional'
  profile_photo?: string
  nickname?: string
  phone?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  categories?: string[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parent_id?: string
  level: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number // em minutos
  price: number
  category: string
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  user_id: string
  specialties: string[]
  availability: string // JSON string com horários disponíveis
  created_at: string
  updated_at: string
} 