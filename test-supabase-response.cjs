const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testando resposta do Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSupabaseResponse() {
  try {
    console.log('🔄 1. Testando conexão básica...')
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão básica:', error.message)
      return false
    }
    
    console.log('✅ 2. Conexão básica OK')
    
    console.log('🔄 3. Testando autenticação...')
    
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError.message)
      return false
    }
    
    console.log('✅ 4. Autenticação OK')
    
    console.log('🔄 5. Testando login...')
    
    const startTime = Date.now()
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@beautycom.com',
      password: '123456'
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️ 6. Login levou ${duration}ms`)
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message)
      return false
    }
    
    console.log('✅ 7. Login bem-sucedido!')
    console.log('Usuário ID:', loginData.user.id)
    
    return true
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando teste de resposta...\n')
  
  const success = await testSupabaseResponse()
  
  if (success) {
    console.log('\n✅ Supabase está respondendo corretamente!')
  } else {
    console.log('\n❌ Problema com Supabase')
  }
  
  console.log('\n🏁 Teste concluído!')
}

main() 