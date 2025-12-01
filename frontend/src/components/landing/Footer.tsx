import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-travel-neutral text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="flex items-center space-x-2 text-2xl font-bold mb-4 hover:opacity-80 transition-opacity"
            >
              <span className="text-3xl">✈️</span>
              <span>Travel Assistant</span>
            </Link>
            <p className="text-white/70 leading-relaxed max-w-md">
              {t('landing.footer.slogan')}
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {t('landing.footer.company.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.company.about')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.company.careers')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.company.mobile')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {t('landing.footer.contact.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.contact.help')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.contact.press')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.contact.affiliates')}
                </a>
              </li>
            </ul>
          </div>

          {/* More Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              {t('landing.footer.more.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.more.airlinefees')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.more.airline')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  {t('landing.footer.more.lowfare')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & App Stores */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>

            {/* App Stores */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <p className="text-white/70 text-sm font-medium">
                {t('landing.footer.social.discover')}
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  {t('landing.footer.social.getOnPlay')}
                </a>
                <a
                  href="#"
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                >
                  {t('landing.footer.social.downloadAppStore')}
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-white/20 text-center">
            <p className="text-white/60 text-sm">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

