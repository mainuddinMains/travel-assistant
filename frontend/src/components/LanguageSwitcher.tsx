import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const LANG_KEY = "lang";

const LANGS: Array<{ code: string; icon: string }> = [
  { code: "en", icon: "🇬🇧" },
  { code: "bn", icon: "🇧🇩" },
  { code: "hi", icon: "🇮🇳" },
  { code: "ko", icon: "🇰🇷" }
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(i18n.language || "en");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && stored !== current) {
      i18n.changeLanguage(stored);
      setCurrent(stored);
    }
  }, [current, i18n]);

  useEffect(() => {
    const handleClick = () => setOpen(false);
    if (open) {
      document.addEventListener("click", handleClick);
    }
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrent(lng);
      document.body.classList.add("language-switching");
      window.setTimeout(() => {
        document.body.classList.remove("language-switching");
      }, 600);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = (code: string) => {
    localStorage.setItem(LANG_KEY, code);
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const activeLang = LANGS.find(lang => i18n.language.startsWith(lang.code)) ?? LANGS[0];

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-travel-neutral-light/60 bg-white px-4 py-2 text-sm font-medium text-travel-neutral shadow-travel-sm hover:shadow-travel-md transition-all"
        onClick={event => {
          event.stopPropagation();
          setOpen(prev => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcher.ariaLabel")}
      >
        <span>{activeLang.icon}</span>
        <span className="hidden sm:inline">{t(`language.names.${activeLang.code}`)}</span>
        <svg className="h-4 w-4 text-travel-neutral/80" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>

      {open && (
        <ul
          className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-travel-neutral-light/50 bg-white shadow-travel-lg"
          role="listbox"
        >
          {LANGS.map(lang => (
            <li key={lang.code}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  current.startsWith(lang.code)
                    ? "bg-travel-primary/10 text-travel-primary"
                    : "text-travel-neutral hover:bg-travel-neutral-lightest"
                }`}
                onClick={event => {
                  event.stopPropagation();
                  changeLanguage(lang.code);
                }}
                aria-selected={current.startsWith(lang.code)}
                role="option"
              >
                <span>{lang.icon}</span>
                <span>{t(`language.names.${lang.code}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
