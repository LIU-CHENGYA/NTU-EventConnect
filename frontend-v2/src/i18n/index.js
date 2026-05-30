import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import zhTW from "./zh-TW.json";
import en from "./en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "zh-TW",
    supportedLngs: ["zh-TW", "en"],
    resources: {
      "zh-TW": { translation: zhTW },
      en: { translation: en },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
  });

// Keep <html lang> in sync so native <input type="date"> shows the
// correct locale placeholder format (e.g. MM/DD/YYYY vs 年/月/日) in Chrome.
function applyHtmlLang(lng) {
  document.documentElement.lang = lng.startsWith("en") ? "en" : "zh-TW";
}
i18n.on("languageChanged", applyHtmlLang);
// Also apply immediately (LanguageDetector reads localStorage synchronously).
if (i18n.language) applyHtmlLang(i18n.language);

export default i18n;
