
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const LANG_KEY = 'lang'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिन्दी' }
]

export function LanguageGate() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [selected, setSelected] = useState<string>(() => localStorage.getItem(LANG_KEY) || '')

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored) {
      i18n.changeLanguage(stored)
      setSelected(stored)
    }
  }, [i18n])

  const choose = (code: string) => {
    localStorage.setItem(LANG_KEY, code)
    i18n.changeLanguage(code)
    setSelected(code)
    nav('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold mb-4">{t('language.choose')}</h1>
        {selected && (
          <p className="text-sm text-gray-600 mb-4">
            Current: {LANGS.find(l => l.code === selected)?.label}
          </p>
        )}
        <div className="space-y-2">
          {LANGS.map(l => (
            <button 
              key={l.code} 
              className={`btn w-full ${selected === l.code ? 'btn-primary' : ''}`} 
              onClick={() => choose(l.code)} 
              aria-pressed={selected === l.code}
            >
              {l.label}
              {selected === l.code && <span className="ml-2">✓</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button 
            className="link text-sm" 
            onClick={() => nav('/login')}
          >
            {t('continue')} {t('language.change').toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  )
}
