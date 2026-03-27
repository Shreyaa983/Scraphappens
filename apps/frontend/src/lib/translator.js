/**
 * Simple translation utility using a free unofficial Google Translate endpoint.
 * This does not require an API key and is suitable for small to medium projects.
 */

const CACHE_KEY = 'translation_cache';

const getCache = () => {
    try {
        const cache = localStorage.getItem(CACHE_KEY);
        return cache ? JSON.parse(cache) : {};
    } catch (e) {
        return {};
    }
};

const setCache = (cache) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        // Clear cache if it gets too large
        localStorage.removeItem(CACHE_KEY);
    }
};

/**
 * Translates text to a target language.
 * @param {string} text - The text to translate.
 * @param {string} targetLang - The language code (e.g., 'hi', 'es', 'fr').
 * @returns {Promise<string>} - The translated text.
 */
export const translateText = async (text, targetLang) => {
    if (!text || targetLang === 'en' || !targetLang) return text;

    const cache = getCache();
    const cacheKey = `${targetLang}:${text}`;
    if (cache[cacheKey]) return cache[cacheKey];

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Translation failed');
        
        const data = await response.json();
        // The response format for 'single' endpoint is nested arrays: [[["translated", "original", ...]]]
        const translatedText = data[0].map(item => item[0]).join('');
        
        // Save to cache
        cache[cacheKey] = translatedText;
        setCache(cache);
        
        return translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Fallback to original text
    }
};
