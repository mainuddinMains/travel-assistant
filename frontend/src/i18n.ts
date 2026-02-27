import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "./locales/en/translation.json";
import bnTranslation from "./locales/bn/translation.json";
import hiTranslation from "./locales/hi/translation.json";
import koTranslation from "./locales/ko/translation.json";

const isDev = import.meta.env.DEV;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      bn: { translation: bnTranslation },
      hi: { translation: hiTranslation },
      ko: { translation: koTranslation },
    },
    fallbackLng: "en",
    debug: isDev,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
  });

i18n.on("languageChanged", lng => {
  document.documentElement.lang = lng;
  document.documentElement.dir = "ltr";
});

export default i18n;
