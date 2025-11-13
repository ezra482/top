// pages/_app.js
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['zh', 'en', 'es', 'fr', 'ru', 'ar'],
    detection: {
      order: ['path', 'cookie', 'htmlTag', 'localStorage', 'subdomain'],
      caches: ['cookie'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // 从URL参数中获取语言（如?lang=zh）
    const lang = router.query.lang;
    if (lang && typeof lang === 'string') {
      i18n.changeLanguage(lang);
    }
  }, [router.query.lang]);

  return <Component {...pageProps} />;
}

export default MyApp;
