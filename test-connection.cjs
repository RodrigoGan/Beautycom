const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testando conectividade com Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔄 Testando conexão básica...')
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro de conexão:', error.message)
      return false
    }
    
    console.log('✅ Conexão básica OK')
    return true
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
    return false
  }
}

async function testAuthConnection() {
  try {
    console.log('🔄 Testando conexão de autenticação...')
    
    // Teste de autenticação sem login
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erro de autenticação:', error.message)
      return false
    }
    
    console.log('✅ Conexão de autenticação OK')
    return true
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
    return false
  }
}

async function testLoginWithTimeout() {
  try {
    console.log('🔄 Testando login com timeout...')
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Login demorou muito')), 30000)
    })
    
    const loginPromise = supabase.auth.signInWithPassword({
      email: 'rodrigo_gan@hotmail.com',
      password: '123456'
    })
    
    const result = await Promise.race([loginPromise, timeoutPromise])
    const { data, error } = result
    
    if (error) {
      console.error('❌ Erro no login:', error.message)
      return false
    }
    
    console.log('✅ Login bem-sucedido!')
    console.log('Usuário ID:', data.user.id)
    return true
    
  } catch (err) {
    console.error('❌ Erro no login:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando testes de conectividade...\n')
  
  const basicConnection = await testConnection()
  const authConnection = await testAuthConnection()
  
  if (basicConnection && authConnection) {
    console.log('\n✅ Todas as conexões OK, testando login...')
    await testLoginWithTimeout()
  } else {
    console.log('\n❌ Problemas de conectividade detectados')
  }
  
  console.log('\n🏁 Testes concluídos!')
}

main() 