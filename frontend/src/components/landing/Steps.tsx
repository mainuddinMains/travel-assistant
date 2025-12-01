import { useTranslation } from 'react-i18next'
import { MapPin, CreditCard, Plane } from 'lucide-react'

export function Steps() {
  const { t } = useTranslation()

  const steps = [
    {
      number: '01',
      icon: MapPin,
      title: t('landing.steps.step1.title'),
      description: t('landing.steps.step1.description'),
      color: 'text-yellow-500 bg-yellow-50'
    },
    {
      number: '02',
      icon: CreditCard,
      title: t('landing.steps.step2.title'),
      description: t('landing.steps.step2.description'),
      color: 'text-orange-500 bg-orange-50'
    },
    {
      number: '03',
      icon: Plane,
      title: t('landing.steps.step3.title'),
      description: t('landing.steps.step3.description'),
      color: 'text-blue-500 bg-blue-50'
    }
  ]

  return (
    <section id="steps" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left Column - Steps */}
          <div>
            <div className="mb-8">
              <p className="text-sm md:text-base font-semibold text-travel-neutral/60 uppercase tracking-wider mb-2">
                {t('landing.steps.easy')}
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-travel-neutral">
                {t('landing.steps.title')}
              </h2>
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-6 group"
                >
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <step.icon size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-travel-neutral/30">
                        {step.number}
                      </span>
                      <h3 className="text-xl font-bold text-travel-neutral">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-travel-neutral/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Trip Card */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-xl border border-travel-neutral-light/30 overflow-hidden hover-lift transition-all">
              {/* Trip Image Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-travel-primary/20 to-travel-accent/20 flex items-center justify-center">
                <div className="text-7xl">🏝️</div>
              </div>

              {/* Trip Info */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-travel-neutral mb-2">
                  Trip To Greece
                </h3>
                <p className="text-travel-neutral/60 mb-4">
                  14-29 June | by Robbin J.
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-travel-neutral-light/30">
                  <div className="flex items-center gap-2 text-travel-neutral/60">
                    <span className="text-sm">24 people going</span>
                  </div>
                  <button className="text-travel-accent hover:text-travel-primary transition-colors">
                    ❤️
                  </button>
                </div>
              </div>

              {/* Progress Card Overlay */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-travel-neutral-light/30">
                <p className="text-xs font-semibold text-travel-neutral mb-1">
                  Ongoing Trip to rome
                </p>
                <div className="w-32 h-2 bg-travel-neutral-lightest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-travel-primary to-travel-accent w-2/5"></div>
                </div>
                <p className="text-xs text-travel-neutral/60 mt-1">40% completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

