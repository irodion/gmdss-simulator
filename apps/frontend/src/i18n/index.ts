import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonEn from "./en/common.json";
import authEn from "./en/auth.json";
import learningEn from "./en/learning.json";
import progressEn from "./en/progress.json";

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
      learning: learningEn,
      progress: progressEn,
    },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
