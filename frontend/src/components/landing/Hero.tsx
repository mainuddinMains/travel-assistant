import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Play } from 'lucide-react'

export function Hero() {
  const { t } = useTranslation()
  const nav = useNavigate()

  return (
    <section className="pt-24 md:pt-32 pb-16 md:pb-24 bg-gradient-to-br from-travel-neutral-lightest via-white to-travel-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center md:text-left space-y-6">
            <p className="text-sm md:text-base font-semibold text-travel-accent uppercase tracking-wider">
              {t('landing.hero.tagline')}
            </p>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-travel-neutral leading-tight">
              {t('landing.hero.title').split(' ').map((word, index) => (
                <span key={index}>
                  {word === 'enjoy' ? (
                    <span className="relative">
                      {word}
                      <span className="absolute bottom-0 left-0 right-0 h-2 bg-travel-accent/30 -z-10 transform translate-y-1"></span>
                    </span>
                  ) : (
                    word
                  )}{' '}
                </span>
              ))}
            </h1>
            
            <p className="text-lg md:text-xl text-travel-neutral/70 max-w-xl mx-auto md:mx-0 leading-relaxed">
              {t('landing.hero.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
              <button
                onClick={() => nav('/language')}
                className="btn btn-primary px-8 py-4 text-lg font-semibold hover-lift"
              >
                {t('landing.hero.ctaPrimary')}
              </button>
              <button
                onClick={() => {
                  // Scroll to features section or play demo video
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="btn bg-white border-2 border-travel-neutral-light text-travel-neutral px-8 py-4 text-lg font-semibold hover-lift flex items-center justify-center gap-2"
              >
                <Play size={20} fill="currentColor" />
                {t('landing.hero.ctaSecondary')}
              </button>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              {/* Placeholder for hero image - you can replace with actual image */}
              <div className="bg-gradient-to-br from-travel-primary/10 to-travel-accent/10 rounded-3xl p-8 md:p-12 aspect-square flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-8xl md:text-9xl">✈️</div>
                  <div className="text-6xl md:text-7xl">🧳</div>
                  <div className="text-4xl md:text-5xl">🗺️</div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-travel-accent/20 rounded-full blur-2xl -z-10 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-travel-primary/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
    </section>
  )
}

