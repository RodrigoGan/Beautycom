const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dgkzxadlmiafbegmdxcz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbWlhZmJlZ21keGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTI0OTUsImV4cCI6MjA2OTM2ODQ5NX0.MyYN4cA5pLsKb1uklQRIpX1rEuahBj4DZFcp1ljgvss'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testProfessionalUsers() {
  console.log('🔍 Testando busca de profissionais (como o frontend faz)...')
  
  try {
    // Simular exatamente o que o frontend faz
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Aplicar filtro de tipo de usuário
    query = query.eq('user_type', 'profissional')
    
    // Paginação
    query = query.range(0, 11) // limit = 12

    console.log('🔍 Query final: SELECT * FROM users WHERE user_type = "profissional" ORDER BY created_at DESC LIMIT 12')
    
    const { data, error, count } = await query

    if (error) {
      console.error('❌ Erro ao buscar profissionais:', error.message)
      return
    }

    console.log(`✅ Profissionais carregados: ${data?.length || 0} de ${count || 0}`)
    
    if (data && data.length > 0) {
      console.log('📋 Profissionais encontrados:', data.map(u => ({ 
        id: u.id, 
        name: u.name, 
        user_type: u.user_type,
        nickname: u.nickname,
        cidade: u.cidade
      })))
    } else {
      console.log('❌ Nenhum profissional encontrado')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testProfessionalUsers()
