import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../lib/translator';

export const useTranslation = () => {
    const { language } = useLanguage();
    const [cache, setCache] = useState({});

    const t = useCallback((text) => {
        if (!text) return '';
        if (language === 'en') return text;
        
        const cacheKey = `${language}:${text}`;
        if (cache[cacheKey]) return cache[cacheKey];

        // If not in local component cache, we return the text but trigger a translation
        // This will cause a re-render once the translation is ready.
        translateText(text, language).then(translated => {
            setCache(prev => ({
                ...prev,
                [cacheKey]: translated
            }));
        });

        return text; // Initial return while translating
    }, [language, cache]);

    return { t, language };
};
