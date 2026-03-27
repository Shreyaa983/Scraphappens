import React, { createContext, useState, useContext, useEffect } from 'react';
import { translateText } from '../lib/translator';

const LanguageContext = createContext();

export const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', voiceName: 'Google US English' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', voiceName: 'Google हिन्दी' },
    { code: 'es', name: 'Español', flag: '🇪🇸', voiceName: 'Google Español' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', voiceName: 'Google Français' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', voiceName: 'Google Deutsch' },
    { code: 'zh', name: '中文', flag: '🇨🇳', voiceName: 'Google Mandarin' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', voiceName: 'Google Japanese' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', voiceName: 'Google Russian' }
];

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app_language_preference') || 'en';
    });

    const [translations, setTranslations] = useState({});

    useEffect(() => {
        localStorage.setItem('app_language_preference', language);
    }, [language]);

    const changeLanguage = (code) => {
        setLanguage(code);
    };

    // This function can be used to translate a specific piece of text on demand
    const translate = async (text) => {
        if (language === 'en') return text;
        return await translateText(text, language);
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, translate, languages }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
