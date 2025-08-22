import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useImageCacheDebug } from './OptimizedImage'
import { debugLoops, clearLoopDetection } from '@/utils/loopDetector'
import { clearImageCache, getImageCacheStats } from '@/hooks/useImageCache'

interface PerformanceDebugProps {
  isVisible?: boolean
}

export const PerformanceDebug: React.FC<PerformanceDebugProps> = ({ isVisible = false }) => {
  const [imageStats, setImageStats] = useState(getImageCacheStats())
  const [loopStats, setLoopStats] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Atualizar estatísticas a cada 5 segundos (REDUZIDO para economizar recursos)
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setImageStats(getImageCacheStats())
      setLoopStats(debugLoops())
    }, 5000) // Aumentado de 1s para 5s

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
      <Card className="w-80 bg-black/90 text-white border-gray-700 pointer-events-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>🔍 Performance Debug</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-white hover:bg-white/10"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Estatísticas de Cache de Imagens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>📸 Cache de Imagens:</span>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {imageStats.total} total
                </Badge>
                <Badge variant="default" className="text-xs bg-green-600">
                  {imageStats.loaded} carregadas
                </Badge>
                {imageStats.errors > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {imageStats.errors} erros
                  </Badge>
                )}
              </div>
            </div>

            {/* Estatísticas de Loops */}
            {loopStats && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>🔄 Loops Detectados:</span>
                  <Badge variant={loopStats.warningsIssued > 0 ? "destructive" : "secondary"} className="text-xs">
                    {loopStats.warningsIssued} warnings
                  </Badge>
                </div>
                
                {isExpanded && loopStats.topOffenders.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-semibold">Top Offenders:</span>
                    {loopStats.topOffenders.slice(0, 3).map((offender: any, index: number) => (
                      <div key={index} className="flex justify-between text-gray-300">
                        <span className="truncate">{offender.name}</span>
                        <span>{offender.callsPerSecond.toFixed(1)}/s</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            {isExpanded && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    clearImageCache()
                    clearLoopDetection()
                    setImageStats(getImageCacheStats())
                    setLoopStats(debugLoops())
                  }}
                  className="text-xs h-6"
                >
                  🧹 Limpar Cache
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLoopStats(debugLoops())
                  }}
                  className="text-xs h-6"
                >
                  🔄 Refresh
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook para controlar visibilidade do debug
export const usePerformanceDebug = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mostrar apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }
  }, [])

  return { isVisible, setIsVisible }
}

