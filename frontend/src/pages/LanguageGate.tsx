
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const LANG_KEY = 'lang'

const AVAILABLE_LANGUAGES: Array<{ code: string; icon: string }> = [
  { code: 'en', icon: '🇬🇧' },
  { code: 'bn', icon: '🇧🇩' },
  { code: 'hi', icon: '🇮🇳' },
  { code: 'ko', icon: '🇰🇷' }
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-travel-neutral-lightest to-travel-neutral-light/20">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🌐</div>
          <h1 className="text-2xl font-heading font-bold mb-2 bg-gradient-to-r from-travel-primary to-travel-primaryLight bg-clip-text text-transparent">
            {t('language.chooseTitle')}
          </h1>
          <p className="text-sm text-travel-neutral/70">{t('language.chooseSubtitle')}</p>
        </div>
        {selected && (
          <div className="mb-4 p-3 rounded-xl bg-travel-primary/10 border border-travel-primary/20">
            <p className="text-sm text-travel-primary font-semibold flex items-center justify-center gap-2">
              <span>✓</span> {t('language.current', { language: t(`language.names.${selected}`) })}
            </p>
          </div>
        )}
        <div className="space-y-3">
          {AVAILABLE_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`btn w-full py-3 font-semibold transition-all duration-300 ${
                selected === lang.code
                  ? 'btn-primary pulse-active'
                  : 'bg-white hover:bg-travel-neutral-lightest'
              }`}
              onClick={() => choose(lang.code)}
              aria-pressed={selected === lang.code}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl" role="img" aria-hidden="true">{lang.icon}</span>
                {t(`language.names.${lang.code}`)}
                {selected === lang.code && <span className="text-xl">✓</span>}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button
            className="link text-sm"
            onClick={() => nav('/login')}
          >
            {t('language.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
