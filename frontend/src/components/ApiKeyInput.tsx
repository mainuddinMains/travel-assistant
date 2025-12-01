import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void
  currentApiKey?: string
}

export function ApiKeyInput({ onApiKeySet, currentApiKey }: ApiKeyInputProps) {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (currentApiKey && currentApiKey !== 'your_google_maps_api_key_here') {
      setIsVisible(false)
    } else {
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
      localStorage.setItem('google_maps_api_key', apiKey.trim())
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="card max-w-md w-full mx-4 shadow-travel-xl border-2 border-travel-primary/20 animate-slide-up">
        <h2 className="text-2xl font-heading font-bold mb-4 text-travel-primary flex items-center gap-2">
          <span className="text-3xl">🔑</span> {t('modals.apiKeyTitle')}
        </h2>
        <p className="text-travel-neutral/80 mb-6 leading-relaxed">
          {t('modals.apiKeyDescription')}{' '}
          <a 
            href="https://console.cloud.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-travel-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            Google Cloud Console
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="apiKey" className="label">
              {t('modals.apiKeyLabel')}
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('modals.apiKeyPlaceholder')}
              className="input"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              {t('modals.apiKeyPrimary')}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="btn flex-1"
            >
              {t('modals.apiKeySecondary')}
            </button>
          </div>
        </form>
        
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-travel-primary/5 to-transparent border border-travel-neutral-light/30 space-y-2">
          <p className="text-xs text-travel-neutral/80">
            <span className="font-semibold">💡</span> {t('modals.apiKeyTip')}
          </p>
          <p className="text-xs text-travel-neutral/80">
            <span className="font-semibold">🔒</span> {t('modals.apiKeySecurity')}
          </p>
        </div>
      </div>
    </div>
  )
}


