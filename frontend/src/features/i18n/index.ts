
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en_auth from '../../locales/en/auth.json'
import en_common from '../../locales/en/common.json'
import en_validation from '../../locales/en/validation.json'

import es_auth from '../../locales/es/auth.json'
import es_common from '../../locales/es/common.json'
import es_validation from '../../locales/es/validation.json'

import hi_auth from '../../locales/hi/auth.json'
import hi_common from '../../locales/hi/common.json'
import hi_validation from '../../locales/hi/validation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: { auth: en_auth, common: en_common, validation: en_validation },
      es: { auth: es_auth, common: es_common, validation: es_validation },
      hi: { auth: hi_auth, common: hi_common, validation: hi_validation },
    },
    ns: ['common', 'auth', 'validation'],
    defaultNS: 'common'
  })

export default i18n
