import { useTranslation } from 'react-i18next'

export function Partners() {
  const { t } = useTranslation()

  const partners = [
    { name: 'Axon', logo: 'AXON' },
    { name: 'Jetstar', logo: 'JETSTAR' },
    { name: 'Expedia', logo: 'EXPEDIA' },
    { name: 'QANTAS', logo: 'QANTAS' },
    { name: 'Alitalia', logo: 'ALITALIA' }
  ]

  return (
    <section className="py-12 md:py-16 bg-white border-y border-travel-neutral-light/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 hover:opacity-100 transition-opacity">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="text-2xl md:text-3xl font-bold text-travel-neutral/40 hover:text-travel-primary transition-colors cursor-pointer"
            >
              {partner.logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

