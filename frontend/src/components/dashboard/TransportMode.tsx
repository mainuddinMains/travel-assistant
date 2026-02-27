/**
 * TransportMode Component - Phase 3
 * Transport mode selector (Drive, Transit, Walk, Bike)
 */

import { useCallback } from 'react'
import './RoutePlanning.css'

export type TransportMode = 'driving' | 'transit' | 'walking' | 'bicycling'

interface TransportModeProps {
  mode: TransportMode
  onChange: (mode: TransportMode) => void
}

export function TransportMode({ mode, onChange }: TransportModeProps) {
  const modes: Array<{ value: TransportMode; label: string; icon: string; title: string }> = [
    {
      value: 'driving',
      label: 'Drive',
      title: 'Driving',
      icon: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z'
    },
    {
      value: 'transit',
      label: 'Transit',
      title: 'Transit',
      icon: 'M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'
    },
    {
      value: 'walking',
      label: 'Walk',
      title: 'Walking',
      icon: 'M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7'
    },
    {
      value: 'bicycling',
      label: 'Bike',
      title: 'Bicycling',
      icon: 'M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4 2.4-2.4 2.4 1.4 1.4 3.8-3.8-3.8-3.8-1.4 1.4zm8.2 1.5c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z'
    }
  ]

  const handleClick = useCallback((selectedMode: TransportMode) => {
    onChange(selectedMode)
  }, [onChange])

  return (
    <div className="transport-mode-box">
      <div className="transport-modes">
        {modes.map(modeOption => (
          <button
            key={modeOption.value}
            className={`mode-btn ${mode === modeOption.value ? 'active' : ''}`}
            onClick={() => handleClick(modeOption.value)}
            title={modeOption.title}
            type="button"
          >
            <svg className="mode-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d={modeOption.icon} />
            </svg>
            <span className="mode-label">{modeOption.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

