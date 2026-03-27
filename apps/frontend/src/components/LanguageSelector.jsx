import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, languages } from '../contexts/LanguageContext';
import '../styles/LanguageSelector.css';

const LanguageSelector = () => {
    const { language, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = languages.find(l => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="language-selector-container" ref={dropdownRef}>
            <button 
                className={`language-selector-button ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="flag">{currentLang.flag}</span>
                <span className="lang-name">{currentLang.name}</span>
                <span className={`arrow ${isOpen ? 'up' : 'down'}`}>▾</span>
            </button>

            {isOpen && (
                <ul className="language-dropdown-list" role="listbox">
                    {languages.map((lang) => (
                        <li 
                            key={lang.code}
                            className={`language-option ${lang.code === language ? 'selected' : ''}`}
                            onClick={() => {
                                changeLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            role="option"
                            aria-selected={lang.code === language}
                        >
                            <span className="flag">{lang.flag}</span>
                            <span className="lang-name">{lang.name}</span>
                            {lang.code === language && <span className="check">✓</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LanguageSelector;
