import React, { useState, useEffect } from 'react'

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void
  currentApiKey?: string
}

export function ApiKeyInput({ onApiKeySet, currentApiKey }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if we already have an API key
    if (currentApiKey && currentApiKey !== 'your_google_maps_api_key_here') {
      setIsVisible(false)
    } else {
      // Check localStorage
      const storedKey = localStorage.getItem('google_maps_api_key')
      if (storedKey) {
        setApiKey(storedKey)
        onApiKeySet(storedKey)
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    }
  }, [currentApiKey, onApiKeySet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      // Store in localStorage
      localStorage.setItem('google_maps_api_key', apiKey.trim())
      // Notify parent component
      onApiKeySet(apiKey.trim())
      setIsVisible(false)
    }
  }

  const handleSkip = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">🔑 Google Maps API Key Required</h2>
        <p className="text-gray-600 mb-4">
          To use Google Maps, please enter your API key. You can get one from{' '}
          <a 
            href="https://console.cloud.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Google Cloud Console
          </a>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Maps API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Use API Key
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Use Fallback Map
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>💡 <strong>Tip:</strong> Your API key will be stored locally and used for this session.</p>
          <p>🔒 <strong>Security:</strong> The key is only stored in your browser's localStorage.</p>
        </div>
      </div>
    </div>
  )
}


