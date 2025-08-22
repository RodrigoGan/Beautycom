const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dgkzxadlmiafbegmdxcz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbWlhZmJlZ21keGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTI0OTUsImV4cCI6MjA2OTM2ODQ5NX0.MyYN4cA5pLsKb1uklQRIpX1rEuahBj4DZFcp1ljgvss'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUsers() {
  console.log('🔍 Testando busca de usuários...')
  
  try {
    // Teste 1: Buscar todos os usuários
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    console.log('📊 Todos os usuários:', allUsers?.length || 0)
    if (allError) console.error('❌ Erro:', allError.message)
    else console.log('✅ Usuários encontrados:', allUsers?.map(u => ({ id: u.id, name: u.name, user_type: u.user_type })))
    
    // Teste 2: Buscar apenas profissionais
    const { data: professionals, error: profError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'profissional')
      .limit(5)
    
    console.log('💇‍♀️ Profissionais:', professionals?.length || 0)
    if (profError) console.error('❌ Erro:', profError.message)
    else console.log('✅ Profissionais encontrados:', professionals?.map(u => ({ id: u.id, name: u.name, user_type: u.user_type })))
    
    // Teste 3: Buscar apenas usuários
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_type', 'usuario')
      .limit(5)
    
    console.log('👤 Usuários:', users?.length || 0)
    if (userError) console.error('❌ Erro:', userError.message)
    else console.log('✅ Usuários encontrados:', users?.map(u => ({ id: u.id, name: u.name, user_type: u.user_type })))
    
    // Teste 4: Contar total
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log('📈 Total de usuários no banco:', count || 0)
    if (countError) console.error('❌ Erro:', countError.message)
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testUsers()
