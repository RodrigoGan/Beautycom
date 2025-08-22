// Script para testar a conexão com o Supabase
// Execute: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testando conexão com Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NÃO ENCONTRADA')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.log('Verifique se o arquivo .env existe e contém:')
  console.log('VITE_SUPABASE_URL=sua_url_aqui')
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_aqui')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n📡 Testando conexão básica...')
    
    // Teste 1: Verificar se consegue acessar a tabela users
    console.log('1. Testando acesso à tabela users...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro ao acessar tabela users:', testError.message)
      console.error('Código:', testError.code)
      console.error('Detalhes:', testError.details)
    } else {
      console.log('✅ Tabela users acessível')
    }
    
    // Teste 2: Contar usuários
    console.log('\n2. Contando usuários...')
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Erro ao contar usuários:', countError.message)
    } else {
      console.log(`✅ Total de usuários: ${count}`)
    }
    
    // Teste 3: Buscar alguns usuários
    console.log('\n3. Buscando usuários...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, nickname, user_type')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message)
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0)
      if (users && users.length > 0) {
        console.log('Primeiro usuário:', users[0])
      }
    }
    
    // Teste 4: Testar filtros
    console.log('\n4. Testando filtros...')
    const { data: filteredUsers, error: filterError } = await supabase
      .from('users')
      .select('id, name, user_type')
      .eq('user_type', 'profissional')
      .limit(3)
    
    if (filterError) {
      console.error('❌ Erro ao filtrar usuários:', filterError.message)
    } else {
      console.log(`✅ Profissionais encontrados: ${filteredUsers?.length || 0}`)
    }
    
    // Teste 5: Verificar políticas RLS
    console.log('\n5. Verificando políticas RLS...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (rlsError && rlsError.code === '42501') {
      console.error('❌ Problema com políticas RLS:', rlsError.message)
      console.log('💡 Execute o script verificar_rls_users.sql no Supabase SQL Editor')
    } else if (rlsError) {
      console.error('❌ Outro erro:', rlsError.message)
    } else {
      console.log('✅ Políticas RLS funcionando')
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    console.error('Stack:', error.stack)
  }
}

testConnection() 