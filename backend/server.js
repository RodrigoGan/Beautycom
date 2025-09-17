const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const path = require('path')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

const app = express()
const PORT = process.env.PORT || 3001

// Headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requests para endpoints críticos
  message: {
    error: 'Muitas tentativas de acesso, tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  }
});

// Middleware
const allowedOrigins = [
  'https://beautycom.app',
  'https://www.beautycom.app',
  'https://beautycom.com.br',
  'https://www.beautycom.com.br',
  'http://localhost:5173', // Para desenvolvimento
  'http://localhost:3000'  // Para desenvolvimento
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' })); // Limitar tamanho do payload

// Aplicar rate limiting
app.use('/api/', limiter);

// Variáveis globais para controle do WhatsApp
let browser = null
let page = null
let isInitialized = false
let isLoggedIn = false

/**
 * Inicializa o WhatsApp Web
 */
app.post('/api/whatsapp/initialize', strictLimiter, async (req, res) => {
  try {
    // Validação de entrada
    if (req.body && Object.keys(req.body).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este endpoint não aceita parâmetros no body'
      });
    }

    console.log('🚀 Inicializando WhatsApp...')
    
    // Fechar instância anterior se existir
    if (browser) {
      await browser.close()
    }

    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production', // Headless em produção
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Melhor performance
        '--disable-javascript', // Desabilitar JS desnecessário
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ],
      userDataDir: './whatsapp-session', // Manter sessão logada
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 30000
    })

    page = await browser.newPage()
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Navegar para WhatsApp Web
    await page.goto('https://web.whatsapp.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })

    // Aguardar QR Code aparecer (com timeout maior)
    try {
      await page.waitForSelector('[data-testid="qr-code"]', { timeout: 30000 })
      console.log('✅ QR Code encontrado!')
    } catch (error) {
      console.log('⚠️ QR Code não encontrado, mas WhatsApp Web carregou')
      // Continuar mesmo sem QR Code (pode já estar logado)
    }
    
    console.log('📱 WhatsApp Web carregado. Aguardando QR Code...')
    
    isInitialized = true
    isLoggedIn = false
    
    res.json({
      success: true,
      message: 'WhatsApp inicializado. Escaneie o QR Code no navegador.'
    })
    
  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error)
    
    // Mensagem de erro mais amigável
    let errorMessage = 'Erro desconhecido'
    if (error.message.includes('qr-code')) {
      errorMessage = 'WhatsApp Web carregou, mas QR Code não foi encontrado. Tente novamente.'
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Timeout ao carregar WhatsApp Web. Verifique sua conexão.'
    } else {
      errorMessage = error.message
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
})

/**
 * Verifica status do login
 */
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    if (!isInitialized || !page) {
      return res.json({
        isLoggedIn: false,
        message: 'WhatsApp não foi inicializado'
      })
    }

    // Verificar se QR Code ainda está visível
    const qrCode = await page.$('[data-testid="qr-code"]')
    const loggedIn = !qrCode
    
    isLoggedIn = loggedIn
    
    res.json({
      isLoggedIn,
      message: loggedIn ? 'Logado com sucesso' : 'Aguardando login'
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    res.status(500).json({
      isLoggedIn: false,
      message: `Erro ao verificar status: ${error.message}`
    })
  }
})

/**
 * Envia uma mensagem individual
 */
async function sendMessage(phone, message) {
  try {
    console.log(`📤 Enviando mensagem para ${phone}`)
    
    // Formatar número (remover caracteres especiais e adicionar código do país se necessário)
    let cleanPhone = phone.replace(/\D/g, '')
    
    // Se não tem código do país, adicionar +55 (Brasil)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
      cleanPhone = '55' + cleanPhone
    } else if (cleanPhone.length === 10) {
      cleanPhone = '5511' + cleanPhone
    }
    
    // Navegar para o chat
    const chatUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
    await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    
    // Aguardar carregamento do chat
    await page.waitForSelector('[data-testid="conversation-compose-box-input"]', { timeout: 15000 })
    
    // Aguardar um pouco para garantir que a mensagem foi carregada
    await page.waitForTimeout(2000)
    
    // Limpar campo e digitar mensagem
    await page.click('[data-testid="conversation-compose-box-input"]')
    await page.keyboard.down('Control')
    await page.keyboard.press('KeyA')
    await page.keyboard.up('Control')
    await page.type('[data-testid="conversation-compose-box-input"]', message)
    
    // Aguardar um pouco antes de enviar
    await page.waitForTimeout(1000)
    
    // Enviar mensagem
    await page.keyboard.press('Enter')
    
    // Aguardar confirmação de envio (verificar se a mensagem aparece na conversa)
    await page.waitForTimeout(3000)
    
    // Verificar se a mensagem foi enviada (procurar por indicador de envio)
    try {
      await page.waitForSelector('[data-testid="msg-check"]', { timeout: 5000 })
      console.log(`✅ Mensagem enviada com sucesso para ${phone}`)
      return { success: true }
    } catch (checkError) {
      console.log(`⚠️ Mensagem pode ter sido enviada para ${phone} (sem confirmação visual)`)
      return { success: true, warning: 'Sem confirmação visual' }
    }
    
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}

/**
 * Envia campanha em lote
 */
app.post('/api/whatsapp/send-campaign', strictLimiter, async (req, res) => {
  try {
    const { messages, options = {} } = req.body
    
    // Validação de entrada
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campo "messages" é obrigatório e deve ser um array não vazio'
      });
    }

    // Validar estrutura das mensagens
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.phone || !msg.message || !msg.professionalId) {
        return res.status(400).json({
          success: false,
          message: `Mensagem ${i + 1} inválida: phone, message e professionalId são obrigatórios`
        });
      }

      // Validar formato do telefone
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(msg.phone)) {
        return res.status(400).json({
          success: false,
          message: `Telefone inválido na mensagem ${i + 1}`
        });
      }

      // Limitar tamanho da mensagem
      if (msg.message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: `Mensagem ${i + 1} muito longa (máximo 1000 caracteres)`
        });
      }
    }

    // Limitar número de mensagens
    if (messages.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Máximo de 100 mensagens por campanha'
      });
    }
    
    if (!isInitialized || !isLoggedIn) {
      return res.status(400).json({
        success: false,
        sentCount: 0,
        failedCount: 0,
        errors: ['WhatsApp não está logado'],
        details: []
      })
    }

    const {
      delayBetweenMessages = 30000, // 30 segundos entre mensagens (mais seguro)
      maxRetries = 2
    } = options

    const result = {
      success: true,
      sentCount: 0,
      failedCount: 0,
      errors: [],
      details: []
    }

    console.log(`📢 Iniciando campanha com ${messages.length} mensagens`)

    for (let i = 0; i < messages.length; i++) {
      const messageData = messages[i]
      
      let success = false
      let lastError = ''

      // Tentar enviar com retry
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const sendResult = await sendMessage(messageData.phone, messageData.message)
          if (sendResult.success) {
            success = true
            result.sentCount++
            result.details.push({
              professionalId: messageData.professionalId,
              phone: messageData.phone,
              status: 'sent'
            })
            break
          } else {
            lastError = sendResult.error || 'Erro desconhecido'
          }
        } catch (error) {
          lastError = error.message
        }

        // Aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          console.log(`🔄 Tentativa ${attempt + 1} para ${messageData.phone} em 5 segundos...`)
          await page.waitForTimeout(5000)
        }
      }

      if (!success) {
        result.failedCount++
        result.errors.push(`Falha ao enviar para ${messageData.phone}: ${lastError}`)
        result.details.push({
          professionalId: messageData.professionalId,
          phone: messageData.phone,
          status: 'failed',
          error: lastError
        })
      }

      // Delay entre mensagens (exceto na última)
      if (i < messages.length - 1) {
        console.log(`⏳ Aguardando ${delayBetweenMessages}ms antes da próxima mensagem...`)
        await page.waitForTimeout(delayBetweenMessages)
      }
    }

    result.success = result.failedCount === 0
    console.log(`📊 Campanha finalizada: ${result.sentCount} enviadas, ${result.failedCount} falharam`)
    
    res.json(result)
    
  } catch (error) {
    console.error('❌ Erro na campanha:', error)
    res.status(500).json({
      success: false,
      sentCount: 0,
      failedCount: 0,
      errors: [error.message],
      details: []
    })
  }
})

/**
 * Para a campanha atual
 */
app.post('/api/whatsapp/stop', async (req, res) => {
  try {
    if (browser) {
      await browser.close()
      browser = null
      page = null
      isInitialized = false
      isLoggedIn = false
    }
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao parar WhatsApp:', error)
    res.status(500).json({
      success: false,
      message: `Erro ao parar: ${error.message}`
    })
  }
})

/**
 * Reinicia a sessão
 */
app.post('/api/whatsapp/restart', async (req, res) => {
  try {
    // Fechar instância atual
    if (browser) {
      await browser.close()
    }
    
    // Reinicializar
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2', timeout: 30000 })
    await page.waitForSelector('[data-testid="qr-code"]', { timeout: 10000 })
    
    isInitialized = true
    isLoggedIn = false
    
    res.json({
      success: true,
      message: 'WhatsApp reiniciado. Escaneie o QR Code novamente.'
    })
    
  } catch (error) {
    console.error('❌ Erro ao reiniciar WhatsApp:', error)
    res.status(500).json({
      success: false,
      message: `Erro ao reiniciar: ${error.message}`
    })
  }
})

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend WhatsApp funcionando!' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`)
  console.log(`📱 Acesse: http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Fechando servidor...')
  if (browser) {
    await browser.close()
  }
  process.exit(0)
})
