import { useTranslation } from 'react-i18next'
import { Cloud, Plane, Mic, Settings, Bot } from 'lucide-react'

export function Features() {
  const { t } = useTranslation()

  const features = [
    {
      icon: Bot,
      title: t('landing.features.aiMode.title'),
      description: t('landing.features.aiMode.description'),
      color: 'text-indigo-500'
    },
    {
      icon: Cloud,
      title: t('landing.features.weather.title'),
      description: t('landing.features.weather.description'),
      color: 'text-yellow-500'
    },
    {
      icon: Plane,
      title: t('landing.features.flights.title'),
      description: t('landing.features.flights.description'),
      color: 'text-blue-500'
    },
    {
      icon: Mic,
      title: t('landing.features.events.title'),
      description: t('landing.features.events.description'),
      color: 'text-purple-500'
    },
    {
      icon: Settings,
      title: t('landing.features.customization.title'),
      description: t('landing.features.customization.description'),
      color: 'text-green-500'
    }
  ]

  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm md:text-base font-semibold text-travel-neutral/60 uppercase tracking-wider mb-2">
            {t('landing.features.category')}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-travel-neutral">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 md:p-8 border border-travel-neutral-light/30 shadow-sm hover:shadow-lg transition-all duration-300 hover-lift group"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-travel-neutral-lightest to-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-travel-neutral mb-3">
                {feature.title}
              </h3>
              
              <p className="text-travel-neutral/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

