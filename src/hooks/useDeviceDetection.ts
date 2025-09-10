import { useState, useEffect } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

interface DeviceInfo {
  type: DeviceType
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    let type: DeviceType = 'desktop'
    if (width < 768) type = 'mobile'
    else if (width < 1024) type = 'tablet'
    
    return {
      type,
      width,
      height,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop'
    }
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      let type: DeviceType = 'desktop'
      if (width < 768) type = 'mobile'
      else if (width < 1024) type = 'tablet'
      
      setDeviceInfo({
        type,
        width,
        height,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop'
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return deviceInfo
}

