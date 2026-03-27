import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Helpline = ({ className }) => {
    const { t } = useTranslation();
    return (
        <div className={`helpline-box ${className}`}>
            <span className="helpline-icon">📞</span>
            <div className="helpline-content">
                <span className="helpline-label">{t('HelpLine')}</span>
                <span className="helpline-number">+1 928 260 2422</span>
            </div>
        </div>
    );
};

export default Helpline;
