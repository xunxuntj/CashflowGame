import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from '../locales/zh-CN.json';
import en from '../locales/en.json';

const resources = {
  'zh-CN': zhCN,
  en: en,
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-CN', // 默认语言
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React 已经自带防 XSS 机制
    },
  });

export default i18n;
