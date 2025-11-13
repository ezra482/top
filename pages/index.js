import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const { t, i18n } = useTranslation('common');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/knowledge/search', {
        params: { query, language, sources: true }
      });
      setAnswer(response.data.answer);
      setSources(response.data.sources || []);
    } catch (error) {
      setAnswer(t('searchError'));
    } finally {
      setLoading(false);
    }
  };

  const LANGUAGES = [
    { code: 'zh', name: t('language.zh') },
    { code: 'en', name: t('language.en') },
    { code: 'es', name: t('language.es') },
    { code: 'fr', name: t('language.fr') },
    { code: 'ru', name: t('language.ru') },
    { code: 'ar', name: t('language.ar') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600">GlobalAI Knowledge Base</h1>
        <p className="text-gray-600 mt-2">{t('slogan')}</p>
      </header>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              i18n.changeLanguage(e.target.value);
            }}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? t('loading') : t('searchButton')}
          </button>
        </div>

        {answer && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('answerTitle')}</h2>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              {answer}
            </div>

            {sources.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">{t('sourcesTitle')}</h3>
                <ul className="list-disc pl-5 text-gray-600">
                  {sources.map((src, idx) => (
                    <li key={idx}>{`${src.type}: ${src.title}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>© 2025 GlobalAI Knowledge Base | {t('openSource')}</p>
      </footer>
    </div>
  );
}
