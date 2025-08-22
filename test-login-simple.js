// Script para testar login simples
// Execute: node test-login-simple.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testando login simples...')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  try {
    console.log('\n📡 Testando login...')
    
    // Teste com credenciais inválidas primeiro
    console.log('1. Testando login com credenciais inválidas...')
    const { data: invalidData, error: invalidError } = await supabase.auth.signInWithPassword({
      email: 'teste@inexistente.com',
      password: 'senha123'
    })
    
    if (invalidError) {
      console.log('✅ Erro esperado com credenciais inválidas:', invalidError.message)
    } else {
      console.log('❌ Não deveria ter funcionado com credenciais inválidas')
    }
    
    // Teste com um dos usuários que já existem no banco
    console.log('\n2. Testando login com usuário existente...')
    const { data: validData, error: validError } = await supabase.auth.signInWithPassword({
      email: 'rodrigogandolpho@gmail.com', // Usuário que já existe
      password: '123456' // Senha padrão
    })
    
    if (validError) {
      console.log('❌ Erro ao fazer login:', validError.message)
      console.log('💡 Verifique se a senha está correta ou se o usuário existe')
    } else {
      console.log('✅ Login bem-sucedido!')
      console.log('Usuário:', validData.user?.email)
      
      // Testar buscar dados do usuário
      if (validData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', validData.user.id)
          .single()
        
        if (userError) {
          console.log('❌ Erro ao buscar dados do usuário:', userError.message)
        } else {
          console.log('✅ Dados do usuário carregados:', userData?.name)
        }
      }
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testLogin() 