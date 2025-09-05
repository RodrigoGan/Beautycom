// Teste de conectividade com Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dgkzxadlmiafbegmdxcz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna3p4YWRsbWlhZmJlZ21keGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI4MDAsImV4cCI6MjA1MTU0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

console.log('🧪 Iniciando teste de conectividade com Supabase...')
console.log('🔗 URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

// Teste 1: Conectividade básica
async function testBasicConnection() {
  try {
    console.log('🔍 Teste 1: Verificando conectividade básica...')
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro na conectividade:', error.message)
      return false
    }
    
    console.log('✅ Conectividade básica OK')
    return true
  } catch (error) {
    console.log('❌ Erro de rede:', error.message)
    return false
  }
}

// Teste 2: Autenticação
async function testAuth() {
  try {
    console.log('🔍 Teste 2: Testando autenticação...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'rodrigo_gan@hotmail.com',
      password: 'teste123'
    })
    
    if (error) {
      console.log('❌ Erro na autenticação:', error.message)
      return false
    }
    
    console.log('✅ Autenticação OK')
    console.log('👤 Usuário:', data.user?.id)
    return true
  } catch (error) {
    console.log('❌ Erro na autenticação:', error.message)
    return false
  }
}

// Teste 3: Query simples
async function testSimpleQuery() {
  try {
    console.log('🔍 Teste 3: Testando query simples...')
    
    const startTime = Date.now()
    
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (error) {
      console.log('❌ Erro na query:', error.message)
      return false
    }
    
    console.log('✅ Query simples OK')
    console.log('⏱️ Duração:', duration + 'ms')
    console.log('📊 Dados retornados:', data?.length || 0)
    return true
  } catch (error) {
    console.log('❌ Erro na query:', error.message)
    return false
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Executando todos os testes...')
  
  const results = {
    basicConnection: await testBasicConnection(),
    auth: await testAuth(),
    simpleQuery: await testSimpleQuery()
  }
  
  console.log('📊 Resultados dos testes:')
  console.log('🔗 Conectividade básica:', results.basicConnection ? '✅' : '❌')
  console.log('🔐 Autenticação:', results.auth ? '✅' : '❌')
  console.log('📝 Query simples:', results.simpleQuery ? '✅' : '❌')
  
  const allPassed = Object.values(results).every(result => result)
  
  if (allPassed) {
    console.log('🎉 Todos os testes passaram! Supabase está funcionando normalmente.')
  } else {
    console.log('⚠️ Alguns testes falharam. Há problemas com o Supabase.')
  }
}

// Executar testes
runAllTests().catch(console.error) 