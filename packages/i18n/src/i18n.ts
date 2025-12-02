import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './locales/en/common.json';
import clientEn from './locales/en/client.json';
import adminEn from './locales/en/admin.json';
import apiEn from './locales/en/api.json';

export const initI18n = () => {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        common: commonEn,
        client: clientEn,
        admin: adminEn,
        api: apiEn,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'client', 'admin', 'api'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

// Initialize i18n
export { i18n };
initI18n();
