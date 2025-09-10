// Utilitário para limitar requisições simultâneas ao Supabase
// Evita sobrecarga do banco de dados e storage

class RequestLimiter {
  private activeRequests = 0
  private maxConcurrentRequests = 3 // Máximo de 3 requisições simultâneas
  private queue: Array<() => Promise<any>> = []
  private processing = false

  async execute<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          this.activeRequests++
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.activeRequests--
          this.processQueue()
        }
      }

      if (this.activeRequests < this.maxConcurrentRequests) {
        executeRequest()
      } else {
        // Adicionar à fila se já atingiu o limite
        this.queue.push(executeRequest)
      }
    })
  }

  private processQueue() {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const nextRequest = this.queue.shift()
      if (nextRequest) {
        nextRequest()
      }
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrentRequests
    }
  }
}

// Instância global do limitador
export const requestLimiter = new RequestLimiter()

// Hook para usar o limitador em componentes
export const useRequestLimiter = () => {
  return {
    execute: requestLimiter.execute.bind(requestLimiter),
    getStats: requestLimiter.getStats.bind(requestLimiter)
  }
}
