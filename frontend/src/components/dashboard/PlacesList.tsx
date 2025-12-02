/**
 * PlacesList Component - Phase 3
 * Selected places list with drag-and-drop reordering
 */

import { useCallback } from 'react'
import { type PlaceData } from '../../services/dashboardApi'
import './RoutePlanning.css'

interface PlacesListProps {
  places: PlaceData[]
  onRemove: (placeId: string) => void
  onReorder: (newOrder: PlaceData[]) => void
  onOptimize: () => void
  onGetDirections: () => void
}

export function PlacesList({ places, onRemove, onReorder, onOptimize, onGetDirections }: PlacesListProps) {
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    e.currentTarget.classList.add('dragging')
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    const sourceIndexStr = e.dataTransfer.getData('text/plain')
    if (!sourceIndexStr) return
    
    const sourceIndex = parseInt(sourceIndexStr, 10)
    
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return

    // Create new array with reordered places
    const newOrder = [...places]
    const [movedPlace] = newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, movedPlace)
    
    console.log('[PlacesList] Reordering:', { sourceIndex, targetIndex, newOrder: newOrder.map(p => p.displayName) })
    
    onReorder(newOrder)
  }, [places, onReorder])

  const getPlaceLabel = useCallback((index: number) => {
    if (index === 0) return 'S'
    if (index === places.length - 1) return 'E'
    return index.toString()
  }, [places.length])

  const getPlaceLabelClass = useCallback((index: number) => {
    if (index === 0) return 'start'
    if (index === places.length - 1) return 'end'
    return ''
  }, [places.length])

  if (places.length === 0) {
    return (
      <div className="places-box">
        <div className="places-header">
          <h3>Places</h3>
          <span className="places-count">0 stops</span>
        </div>
        <div className="places-list">
          <div className="place-item-placeholder">
            <div className="placeholder-box">
              <button className="drag-handle" disabled>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="places-actions">
          <button className="action-btn optimize-btn" disabled>Optimize</button>
          <button className="action-btn direction-btn" disabled>Directions</button>
        </div>
      </div>
    )
  }

  return (
    <div className="places-box">
      <div className="places-header">
        <h3>Places</h3>
        <span className="places-count">{places.length} stops</span>
      </div>
      <div className="places-list">
        {places.map((place, index) => (
          <div
            key={place.placeId}
            className="place-item"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDragOver(e)
            }}
            onDrop={(e) => handleDrop(e, index)}
            data-index={index}
          >
            <div className={`place-number ${getPlaceLabelClass(index)}`}>
              {getPlaceLabel(index)}
            </div>
            <div className="place-info">
              <div className="place-name">{place.displayName}</div>
            </div>
            <button
              className="place-remove"
              onClick={() => onRemove(place.placeId)}
              title="Remove"
              type="button"
            >
              ✕
            </button>
            <button className="drag-handle" title="Drag to reorder" type="button">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="places-actions">
        <button
          className="action-btn optimize-btn"
          onClick={onOptimize}
          disabled={places.length < 2}
        >
          Optimize
        </button>
        <button
          className="action-btn direction-btn"
          onClick={onGetDirections}
          disabled={places.length < 2}
        >
          Directions
        </button>
      </div>
    </div>
  )
}

