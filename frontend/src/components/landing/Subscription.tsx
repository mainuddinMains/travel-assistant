import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Plane } from 'lucide-react'

export function Subscription() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus('error')
      return
    }

    // TODO: Connect to backend API
    console.log('Subscribing:', email)
    setStatus('success')
    setEmail('')
    
    // Reset status after 3 seconds
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-purple-50 via-purple-50/50 to-pink-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-travel-neutral mb-4">
            {t('landing.subscription.title')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-travel-neutral/40">
              <Send size={20} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setStatus('idle')
              }}
              placeholder={t('landing.subscription.placeholder')}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-travel-neutral-light/30 focus:border-travel-primary focus:ring-4 focus:ring-travel-primary/20 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary px-8 py-4 text-lg font-semibold whitespace-nowrap hover-lift"
          >
            {t('landing.subscription.button')}
          </button>
        </form>

        {/* Status Messages */}
        {status === 'success' && (
          <p className="text-center mt-4 text-green-600 font-medium">
            {t('landing.subscription.success')}
          </p>
        )}
        {status === 'error' && (
          <p className="text-center mt-4 text-red-600 font-medium">
            {t('landing.subscription.error')}
          </p>
        )}

        {/* Decorative Plane Icon */}
        <div className="absolute top-8 right-8 text-purple-300/30 hidden md:block">
          <Plane size={64} className="transform rotate-45" />
        </div>
      </div>
    </section>
  )
}

