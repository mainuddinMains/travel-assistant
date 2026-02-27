import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function Testimonials() {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      quote: t('landing.testimonials.mike.quote'),
      name: t('landing.testimonials.mike.name'),
      location: t('landing.testimonials.mike.location'),
      avatar: '👨‍💼'
    },
    {
      quote: t('landing.testimonials.chris.quote'),
      name: t('landing.testimonials.chris.name'),
      role: t('landing.testimonials.chris.role'),
      avatar: '👨‍💻'
    }
  ]

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const current = testimonials[currentIndex]

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-gradient-to-b from-white to-travel-neutral-lightest/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm md:text-base font-semibold text-travel-neutral/60 uppercase tracking-wider mb-2">
            {t('landing.testimonials.title')}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-travel-neutral">
            {t('landing.testimonials.subtitle')}
          </h2>
          
          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-travel-primary w-8'
                    : 'bg-travel-neutral-light/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-travel-neutral-light/30 relative">
            {/* Testimonial Content */}
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-travel-primary/20 to-travel-accent/20 flex items-center justify-center text-3xl">
                  {current.avatar}
                </div>
              </div>

              {/* Quote */}
              <div className="flex-1">
                <p className="text-lg md:text-xl text-travel-neutral/80 leading-relaxed mb-6 italic">
                  "{current.quote}"
                </p>
                
                <div>
                  <p className="font-bold text-travel-neutral text-lg">
                    {current.name}
                  </p>
                  {current.location && (
                    <p className="text-travel-neutral/60">
                      {current.location}
                    </p>
                  )}
                  {current.role && (
                    <p className="text-travel-neutral/60">
                      {current.role}
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={prevTestimonial}
                  className="p-2 rounded-lg border border-travel-neutral-light/30 hover:bg-travel-neutral-lightest transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronUp size={20} className="text-travel-neutral" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="p-2 rounded-lg border border-travel-neutral-light/30 hover:bg-travel-neutral-lightest transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronDown size={20} className="text-travel-neutral" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

