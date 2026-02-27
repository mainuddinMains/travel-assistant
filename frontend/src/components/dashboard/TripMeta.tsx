/**
 * TripMeta Component - Phase 4
 * City selector and date range picker for trip metadata
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import './TripMeta.css'

interface City {
  name: string
  formatted_address: string
  location: { lat: number; lng: number }
  placeId: string
}

interface TripMetaProps {
  onCitiesChange?: (cities: City[]) => void
  onScheduleChange?: (startDate: Date | null, endDate: Date | null) => void
}

export function TripMeta({ onCitiesChange, onScheduleChange }: TripMetaProps) {
  const [cities, setCities] = useState<City[]>([])
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [citySearchVisible, setCitySearchVisible] = useState(false)
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  const [selectingEndDate, setSelectingEndDate] = useState(false)
  const citySearchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (citySearchVisible && citySearchInputRef.current && !autocompleteRef.current) {
      if (!window.google?.maps?.places) {
        console.error('Google Maps Places library not loaded')
        return
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        citySearchInputRef.current,
        {
          types: ['(cities)'],
          fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components']
        }
      )

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (!place?.geometry) return

        const cityData: City = {
          name: place.name || '',
          formatted_address: place.formatted_address || '',
          location: {
            lat: place.geometry.location?.lat() || 0,
            lng: place.geometry.location?.lng() || 0
          },
          placeId: place.place_id || ''
        }

        setCities(prev => {
          const newCities = [...prev, cityData]
          if (onCitiesChange) {
            onCitiesChange(newCities)
          }
          return newCities
        })

        if (citySearchInputRef.current) {
          citySearchInputRef.current.value = ''
        }
      })
    }
  }, [citySearchVisible, onCitiesChange])

  const removeCity = useCallback((index: number) => {
    setCities(prev => {
      const newCities = prev.filter((_, i) => i !== index)
      if (onCitiesChange) {
        onCitiesChange(newCities)
      }
      return newCities
    })
  }, [onCitiesChange])

  const formatDateAbbreviated = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
  }

  const getCityButtonText = (): string => {
    if (cities.length === 0) return 'City'
    if (cities.length === 1) return cities[0].name
    return `${cities.length} cities`
  }

  const getScheduleButtonText = (): string => {
    if (!startDate || !endDate) return 'Schedule'
    return `${formatDateAbbreviated(startDate)} - ${formatDateAbbreviated(endDate)}`
  }

  const handleDateSelect = useCallback((date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return // Don't allow past dates

    if (!selectingEndDate) {
      setSelectedStartDate(date)
      setSelectedEndDate(null)
      setSelectingEndDate(true)
    } else {
      if (date >= (selectedStartDate || new Date())) {
        setSelectedEndDate(date)
        setSelectingEndDate(false)
      } else {
        setSelectedStartDate(date)
        setSelectedEndDate(null)
      }
    }
  }, [selectingEndDate, selectedStartDate])

  const handleApplyDates = useCallback(() => {
    if (!selectedStartDate || !selectedEndDate) return

    setStartDate(selectedStartDate)
    setEndDate(selectedEndDate)
    setDatePickerVisible(false)
    setSelectedStartDate(null)
    setSelectedEndDate(null)
    setSelectingEndDate(false)

    if (onScheduleChange) {
      onScheduleChange(selectedStartDate, selectedEndDate)
    }
  }, [selectedStartDate, selectedEndDate, onScheduleChange])

  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear()
    const month = currentCalendarDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days: JSX.Element[] = []
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Day labels
    dayLabels.forEach(label => {
      days.push(
        <div key={`label-${label}`} className="date-picker-day-label">
          {label}
        </div>
      )
    })

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="date-picker-day disabled"></div>
      )
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      currentDate.setHours(0, 0, 0, 0)

      const isToday = currentDate.getTime() === today.getTime()
      const isDisabled = currentDate < today
      const isSelected =
        (selectedStartDate && currentDate.getTime() === selectedStartDate.getTime()) ||
        (selectedEndDate && currentDate.getTime() === selectedEndDate.getTime())
      const isInRange =
        selectedStartDate &&
        selectedEndDate &&
        currentDate > selectedStartDate &&
        currentDate < selectedEndDate

      days.push(
        <div
          key={`day-${day}`}
          className={`date-picker-day ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isInRange ? 'in-range' : ''}`}
          onClick={() => !isDisabled && handleDateSelect(currentDate)}
        >
          {day}
        </div>
      )
    }

    return days
  }

  return (
    <>
      <div className="trip-meta">
        <button
          className="meta-btn"
          onClick={() => setCitySearchVisible(true)}
          disabled={false}
        >
          {getCityButtonText()}
        </button>
        <button
          className="meta-btn"
          onClick={() => setDatePickerVisible(true)}
          disabled={false}
        >
          {getScheduleButtonText()}
        </button>
      </div>

      {/* City Search Modal */}
      {citySearchVisible && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setCitySearchVisible(false)}
          />
          <div className="city-search" onClick={(e) => e.stopPropagation()}>
            <input
              ref={citySearchInputRef}
              type="text"
              className="city-search-input"
              placeholder="Search for a city..."
              autoFocus
            />
            <div className="city-cards-container">
              {cities.map((city, index) => (
                <div key={index} className="city-card">
                  <span className="city-card-name">{city.name}</span>
                  <button
                    className="city-card-remove"
                    onClick={() => removeCity(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Date Picker Modal */}
      {datePickerVisible && (
        <>
          <div
            className="modal-overlay"
            onClick={() => {
              setDatePickerVisible(false)
              setSelectedStartDate(null)
              setSelectedEndDate(null)
              setSelectingEndDate(false)
            }}
          />
          <div className="date-picker" onClick={(e) => e.stopPropagation()}>
            <div className="date-picker-header">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentCalendarDate(
                    new Date(
                      currentCalendarDate.getFullYear(),
                      currentCalendarDate.getMonth() - 1,
                      1
                    )
                  )
                }}
              >
                ‹
              </button>
              <h3>
                {currentCalendarDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentCalendarDate(
                    new Date(
                      currentCalendarDate.getFullYear(),
                      currentCalendarDate.getMonth() + 1,
                      1
                    )
                  )
                }}
              >
                ›
              </button>
            </div>
            <div className="date-picker-calendar">{renderCalendar()}</div>
            <div className="date-picker-footer">
              <button
                className="cancel-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setDatePickerVisible(false)
                  setSelectedStartDate(null)
                  setSelectedEndDate(null)
                  setSelectingEndDate(false)
                }}
              >
                Cancel
              </button>
              <button
                className="apply-btn"
                disabled={!selectedStartDate || !selectedEndDate}
                onClick={(e) => {
                  e.stopPropagation()
                  handleApplyDates()
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

