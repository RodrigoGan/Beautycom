// Script para testar diferentes senhas
// Execute: node test-login-multiple-passwords.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testando diferentes senhas...')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMultiplePasswords() {
  const email = 'rodrigo_gan@hotmail.com'
  const passwords = [
    '123456',
    'password',
    'senha',
    '123123',
    'admin',
    'user',
    'teste',
    '123456789',
    'qwerty',
    'abc123'
  ]

  console.log(`\n📡 Testando login com: ${email}`)
  console.log('🔑 Tentando diferentes senhas...\n')

  for (const password of passwords) {
    try {
      console.log(`🔄 Tentando senha: ${password}`)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.log(`❌ Senha "${password}" falhou: ${error.message}`)
      } else {
        console.log(`✅ SUCESSO! Senha correta: ${password}`)
        console.log(`👤 Usuário: ${data.user?.email}`)
        console.log(`🆔 ID: ${data.user?.id}`)
        
        // Testar buscar dados do usuário
        if (data.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (userError) {
            console.log('❌ Erro ao buscar dados do usuário:', userError.message)
          } else {
            console.log('✅ Dados do usuário carregados:', userData?.name)
          }
        }
        
        return // Parar após encontrar a senha correta
      }
    } catch (error) {
      console.log(`❌ Erro com senha "${password}":`, error.message)
    }
  }
  
  console.log('\n❌ Nenhuma senha funcionou!')
  console.log('💡 Você precisa redefinir a senha no Supabase Dashboard')
}

testMultiplePasswords() 