// =====================================================
// DETECTOR DE LOOPS INFINITOS - DESENVOLVIMENTO
// =====================================================

interface LoopDetectorConfig {
  maxCalls: number
  timeWindow: number
  componentName?: string
}

class LoopDetector {
  private callCounts = new Map<string, { count: number; firstCall: number; lastCall: number }>()
  private warnings = new Set<string>()

  detect(
    functionName: string,
    config: LoopDetectorConfig = { maxCalls: 10, timeWindow: 1000 }
  ) {
    const key = `${functionName}`
    const now = Date.now()
    
    if (!this.callCounts.has(key)) {
      this.callCounts.set(key, { count: 1, firstCall: now, lastCall: now })
      return
    }

    const record = this.callCounts.get(key)!
    record.count++
    record.lastCall = now

    const timeDiff = now - record.firstCall
    const callsPerSecond = record.count / (timeDiff / 1000)

    // Verificar se está chamando muito frequentemente
    if (record.count > config.maxCalls && timeDiff < config.timeWindow) {
      if (!this.warnings.has(key)) {
        this.warnings.add(key)
        console.warn(
          `🚨 LOOP DETECTADO: ${functionName} foi chamada ${record.count} vezes em ${timeDiff}ms ` +
          `(${callsPerSecond.toFixed(1)} calls/sec). ` +
          `Verifique useEffect, useState ou re-renders desnecessários.`
        )
        
        // Log do stack trace para debug
        console.trace(`Stack trace para ${functionName}:`)
      }
    }

    // Reset se passou muito tempo
    if (timeDiff > config.timeWindow * 2) {
      this.callCounts.delete(key)
      this.warnings.delete(key)
    }
  }

  // Detectar loops em useEffect
  detectUseEffect(componentName: string, dependencies: any[]) {
    const key = `useEffect_${componentName}`
    this.detect(key, { maxCalls: 5, timeWindow: 2000 })
  }

  // Detectar loops em useState
  detectUseState(componentName: string, stateName: string) {
    const key = `useState_${componentName}_${stateName}`
    this.detect(key, { maxCalls: 20, timeWindow: 1000 })
  }

  // Detectar loops em fetch/API calls
  detectApiCall(endpoint: string) {
    const key = `api_${endpoint}`
    this.detect(key, { maxCalls: 3, timeWindow: 5000 })
  }

  // Detectar loops em image loading
  detectImageLoad(imageUrl: string) {
    const key = `image_${imageUrl.substring(0, 50)}`
    this.detect(key, { maxCalls: 5, timeWindow: 3000 })
  }

  // Limpar dados
  clear() {
    this.callCounts.clear()
    this.warnings.clear()
  }

  // Obter estatísticas
  getStats() {
    const stats = {
      totalFunctions: this.callCounts.size,
      warningsIssued: this.warnings.size,
      topOffenders: [] as Array<{ name: string; count: number; callsPerSecond: number }>
    }

    for (const [key, record] of this.callCounts.entries()) {
      const timeDiff = record.lastCall - record.firstCall
      const callsPerSecond = record.count / (timeDiff / 1000)
      
      stats.topOffenders.push({
        name: key,
        count: record.count,
        callsPerSecond
      })
    }

    stats.topOffenders.sort((a, b) => b.callsPerSecond - a.callsPerSecond)
    return stats
  }
}

// Instância global
const loopDetector = new LoopDetector()

// Hooks para uso em componentes
export const useLoopDetection = (componentName: string) => {
  return {
    detectUseEffect: (dependencies: any[]) => {
      loopDetector.detectUseEffect(componentName, dependencies)
    },
    detectUseState: (stateName: string) => {
      loopDetector.detectUseState(componentName, stateName)
    },
    detectApiCall: (endpoint: string) => {
      loopDetector.detectApiCall(endpoint)
    },
    detectImageLoad: (imageUrl: string) => {
      loopDetector.detectImageLoad(imageUrl)
    }
  }
}

// Função para debug global
export const debugLoops = () => {
  const stats = loopDetector.getStats()
  console.log('🔍 LOOP DETECTOR STATS:', stats)
  return stats
}

// Função para limpar
export const clearLoopDetection = () => {
  loopDetector.clear()
}

// Auto-clear a cada 5 minutos em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    loopDetector.clear()
  }, 5 * 60 * 1000)
}

export default loopDetector


