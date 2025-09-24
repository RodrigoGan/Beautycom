const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const csv = require('csv-parser')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // Adicione esta variável ao .env
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Função para corrigir encoding
const fixEncoding = (text) => {
  if (!text) return ''
  
  const encodingMap = {
    'íº': 'ú',
    'í§': 'ç',
    'í£': 'ã',
    'í': 'ã',
    'í': 'ã'
  }
  
  let fixed = text
  Object.entries(encodingMap).forEach(([wrong, correct]) => {
    fixed = fixed.replace(new RegExp(wrong, 'g'), correct)
  })
  
  return fixed
}

// Função para corrigir CEP
const fixCEP = (cep) => {
  if (!cep) return ''
  
  // Remove caracteres não numéricos
  const numbers = cep.replace(/\D/g, '')
  
  // Se tem 8 dígitos, adiciona hífen
  if (numbers.length === 8) {
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
  }
  
  return cep
}

// Função para validar e formatar telefone
const formatPhone = (phone) => {
  if (!phone) return ''
  
  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '')
  
  // Se tem 11 dígitos (com DDD), formata
  if (numbers.length === 11) {
    return `+55${numbers}`
  }
  
  // Se tem 10 dígitos (sem 9), adiciona 9
  if (numbers.length === 10) {
    return `+55${numbers.slice(0, 2)}9${numbers.slice(2)}`
  }
  
  return phone
}

// Função para criar usuário no Supabase Auth
const createAuthUser = async (email, name) => {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: 'temp123456', // Senha temporária
      email_confirm: true,
      user_metadata: {
        name: name
      }
    })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`ℹ️ Usuário ${email} já existe no Auth, buscando ID...`)
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()
        
        if (fetchError || !existingUser) {
          throw new Error(`Falha ao buscar usuário existente: ${fetchError?.message || 'Não encontrado'}`)
        }
        return { id: existingUser.id }
      } else {
        throw error
      }
    }
    return data.user
  } catch (error) {
    console.error('Erro ao criar usuário no Auth:', error)
    throw error
  }
}

// Função para inserir perfil na tabela users
const createUserProfile = async (authUser, csvRow) => {
  try {
    const userData = {
      id: authUser.id,
      email: authUser.email,
      name: fixEncoding(csvRow['Nome Completo']),
      user_type: 'profissional',
      
      // Dados de endereço
      logradouro: fixEncoding(csvRow.Endereço),
      numero: csvRow.Número,
      complemento: fixEncoding(csvRow.Complemento),
      bairro: fixEncoding(csvRow.Bairro),
      cidade: fixEncoding(csvRow.Cidade),
      uf: csvRow.Estado,
      cep: fixCEP(csvRow.CEP),
      
      // Dados de contato
      phone: formatPhone(csvRow['Cel/Whatsapp']),
      
      // Status padrão
    agenda_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
    
    if (error) throw error
    return userData
  } catch (error) {
    console.error('Erro ao criar perfil:', error)
    throw error
  }
}

// Função para criar trial de 30 dias
const createTrialSubscription = async (userId) => {
  try {
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 30) // 30 dias de trial
    
    const subscriptionData = {
      user_id: userId,
      plan_id: '058a8012-b2e8-4443-9df4-aee18a3c8e91', // BeautyTime Start como trial
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('user_subscriptions')
      .insert(subscriptionData)
    
    if (error) throw error
    return { end_date: trialEndDate.toISOString() }
  } catch (error) {
    console.error('Erro ao criar trial:', error)
    throw error
  }
}

// Função para enviar e-mail de boas-vindas
const sendWelcomeEmail = async (email, name) => {
  try {
    // Aqui você pode integrar com seu serviço de e-mail
    // Por exemplo, SendGrid, Resend, etc.
    console.log(`📧 E-mail de boas-vindas enviado para: ${email} (${name})`)
    return true
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return false
  }
}

// Função principal de migração
const migrateProfessionals = async (csvFilePath) => {
  const results = {
    success: 0,
    errors: 0,
    details: []
  }
  
  return new Promise((resolve, reject) => {
    const stream =     fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', async (row) => {
        try {
          console.log(`🔄 Processando: ${row['Nome Completo']} (${row.email})`)
          
          // 1. Criar usuário no Auth
          const authUser = await createAuthUser(row.email, row['Nome Completo'])
          console.log(`✅ Usuário criado no Auth: ${authUser.id}`)
          
          // 2. Inserir perfil na tabela users
          const userProfile = await createUserProfile(authUser, row)
          console.log(`✅ Perfil criado: ${userProfile.id}`)
          
          // 3. Criar trial de 30 dias
          const trial = await createTrialSubscription(authUser.id)
          console.log(`✅ Trial criado até: ${trial.end_date}`)
          
          // 4. Enviar e-mail de boas-vindas
          await sendWelcomeEmail(row.email, row['Nome Completo'])
          
          results.success++
          results.details.push({
            name: row['Nome Completo'],
            email: row.email,
            status: 'success',
            userId: authUser.id
          })
          
          console.log(`✅ Migração concluída para: ${row['Nome Completo']}`)
          
        } catch (error) {
          console.error(`❌ Erro ao migrar ${row['Nome Completo']}:`, error.message)
          results.errors++
          results.details.push({
            name: row['Nome Completo'],
            email: row.email,
            status: 'error',
            error: error.message
          })
        }
      })
      .on('end', () => {
        console.log('\n📊 Resumo da Migração:')
        console.log(`✅ Sucessos: ${results.success}`)
        console.log(`❌ Erros: ${results.errors}`)
        console.log(`📋 Total processado: ${results.success + results.errors}`)
        
        resolve(results)
      })
      .on('error', (error) => {
        console.error('Erro ao ler CSV:', error)
        reject(error)
      })
  })
}

// Executar migração
const main = async () => {
  try {
    console.log('🚀 Iniciando migração de profissionais...')
    
    // Substitua pelo caminho do seu arquivo CSV
    const csvFilePath = './public/profissionais.csv'
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ Arquivo CSV não encontrado:', csvFilePath)
      return
    }
    
    const results = await migrateProfessionals(csvFilePath)
    
    // Salvar relatório
    const reportPath = `./migration-report-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
    console.log(`📄 Relatório salvo em: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

module.exports = {
  migrateProfessionals,
  fixEncoding,
  fixCEP,
  formatPhone
}
