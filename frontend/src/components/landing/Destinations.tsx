import { useTranslation } from 'react-i18next'
import { Plane } from 'lucide-react'

export function Destinations() {
  const { t } = useTranslation()

  const destinations = [
    {
      id: 'rome',
      name: t('landing.destinations.rome.name'),
      price: t('landing.destinations.rome.price'),
      duration: t('landing.destinations.rome.duration'),
      image: 'rome'
    },
    {
      id: 'london',
      name: t('landing.destinations.london.name'),
      price: t('landing.destinations.london.price'),
      duration: t('landing.destinations.london.duration'),
      image: 'london'
    },
    {
      id: 'europe',
      name: t('landing.destinations.europe.name'),
      price: t('landing.destinations.europe.price'),
      duration: t('landing.destinations.europe.duration'),
      image: 'europe'
    }
  ]

  return (
    <section id="destinations" className="py-16 md:py-24 bg-gradient-to-b from-white to-travel-neutral-lightest/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm md:text-base font-semibold text-travel-neutral/60 uppercase tracking-wider mb-2">
            {t('landing.destinations.topSelling')}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-travel-neutral">
            {t('landing.destinations.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {destinations.map((destination) => (
            <div
              key={destination.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift group cursor-pointer"
            >
              {/* Destination Image Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-travel-primary/20 to-travel-accent/20 flex items-center justify-center overflow-hidden">
                <div className="text-6xl md:text-7xl opacity-50 group-hover:scale-110 transition-transform">
                  {destination.id === 'rome' && '🏛️'}
                  {destination.id === 'london' && '🇬🇧'}
                  {destination.id === 'europe' && '🌍'}
                </div>
              </div>

              {/* Destination Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-travel-neutral mb-2">
                  {destination.name}
                </h3>
                
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <p className="text-2xl font-bold text-travel-primary">
                      {destination.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-travel-neutral/70">
                    <Plane size={20} />
                    <span className="text-sm font-medium">
                      {destination.duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

