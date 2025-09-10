import { DeviceType } from '@/hooks/useDeviceDetection'

export interface ScrollConfig {
  threshold: number
  rootMargin: string
  itemsPerPage: number
  debounceMs: number
  cacheSize: number
  cacheTTL: number
}

export const getScrollConfig = (deviceType: DeviceType): ScrollConfig => {
  const configs: Record<DeviceType, ScrollConfig> = {
    mobile: {
      threshold: 0.1,
      rootMargin: '100px',
      itemsPerPage: 8,
      debounceMs: 200,
      cacheSize: 100,
      cacheTTL: 10 * 60 * 1000 // 10 minutos
    },
    tablet: {
      threshold: 0.1,
      rootMargin: '150px',
      itemsPerPage: 12,
      debounceMs: 150,
      cacheSize: 150,
      cacheTTL: 15 * 60 * 1000 // 15 minutos
    },
    desktop: {
      threshold: 0.1,
      rootMargin: '300px',
      itemsPerPage: 16,
      debounceMs: 100,
      cacheSize: 300,
      cacheTTL: 20 * 60 * 1000 // 20 minutos
    }
  }

  return configs[deviceType]
}
