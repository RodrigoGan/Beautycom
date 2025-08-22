const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testando conexão com Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Presente' : 'Ausente')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔍 Testando query simples...')
    
    // Teste 1: Contar registros
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log('📊 Total de registros:', count)
    if (countError) {
      console.error('❌ Erro ao contar:', countError.message)
    }

    // Teste 2: Buscar 5 registros
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    console.log('📋 Dados retornados:', data?.length || 0)
    if (error) {
      console.error('❌ Erro ao buscar:', error.message)
    } else if (data && data.length > 0) {
      console.log('✅ Primeiros registros:')
      data.slice(0, 3).forEach(user => {
        console.log(`  - ${user.name} (${user.user_type})`)
      })
    } else {
      console.log('⚠️ Nenhum registro encontrado')
    }

    // Teste 3: Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Erro ao verificar estrutura:', sampleError.message)
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ Estrutura da tabela:')
      const columns = Object.keys(sampleData[0])
      columns.forEach(col => {
        console.log(`  - ${col}: ${typeof sampleData[0][col]}`)
      })
    }

  } catch (err) {
    console.error('❌ Erro geral:', err.message)
  }
}

testConnection() 