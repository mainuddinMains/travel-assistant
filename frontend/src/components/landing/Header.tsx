import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { Menu, X } from 'lucide-react'

export function Header() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md'
          : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-2xl font-bold text-travel-primary hover:text-travel-primaryLight transition-colors"
          >
            <span className="text-3xl">✈️</span>
            <span>Travel Assistant</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/#destinations"
              className="text-travel-neutral hover:text-travel-primary font-medium transition-colors"
            >
              {t('landing.header.nav.destinations')}
            </Link>
            <Link
              to="/#features"
              className="text-travel-neutral hover:text-travel-primary font-medium transition-colors"
            >
              {t('landing.header.nav.hotels')}
            </Link>
            <Link
              to="/#steps"
              className="text-travel-neutral hover:text-travel-primary font-medium transition-colors"
            >
              {t('landing.header.nav.flights')}
            </Link>
            <Link
              to="/#testimonials"
              className="text-travel-neutral hover:text-travel-primary font-medium transition-colors"
            >
              {t('landing.header.nav.bookings')}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            <button
              onClick={() => nav('/login')}
              className="text-travel-neutral hover:text-travel-primary font-medium transition-colors"
            >
              {t('landing.header.login')}
            </button>
            <button
              onClick={() => nav('/signup')}
              className="btn btn-primary px-6 py-2"
            >
              {t('landing.header.signup')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-travel-neutral"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-travel-neutral-light/20 bg-white">
          <nav className="px-4 py-4 space-y-4">
            <Link
              to="/#destinations"
              className="block text-travel-neutral hover:text-travel-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('landing.header.nav.destinations')}
            </Link>
            <Link
              to="/#features"
              className="block text-travel-neutral hover:text-travel-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('landing.header.nav.hotels')}
            </Link>
            <Link
              to="/#steps"
              className="block text-travel-neutral hover:text-travel-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('landing.header.nav.flights')}
            </Link>
            <Link
              to="/#testimonials"
              className="block text-travel-neutral hover:text-travel-primary font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('landing.header.nav.bookings')}
            </Link>
            <div className="pt-4 border-t border-travel-neutral-light/20 space-y-3">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <button
                onClick={() => {
                  nav('/login')
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-center text-travel-neutral hover:text-travel-primary font-medium py-2"
              >
                {t('landing.header.login')}
              </button>
              <button
                onClick={() => {
                  nav('/signup')
                  setMobileMenuOpen(false)
                }}
                className="btn btn-primary w-full py-2"
              >
                {t('landing.header.signup')}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

