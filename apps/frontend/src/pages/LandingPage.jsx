import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from '../components/LanguageSelector';
import AuthPanel from '../components/AuthPanel';
import OfflineNotice from '../components/OfflineNotice';
import InstallAppPrompt from '../components/InstallAppPrompt';
import GlobalAssistant from '../components/Agentic/GlobalAssistant';
import Helpline from '../components/Helpline';

const LandingPage = ({ 
    openAuth, 
    showAuth, 
    mode, 
    form, 
    updateField, 
    setShowAuth, 
    onSubmit, 
    message 
}) => {
    const { t } = useTranslation();

    return (
        <main className="landing-page">
            <OfflineNotice />
            <InstallAppPrompt />
            <nav className="navbar">
                <div className="brand-block">
                    <span className="brand-mark">S</span>
                    <div>
                        <h1>{t('ScrapHappens')}</h1>
                        <p>{t('Smart circular material marketplace')}</p>
                    </div>
                    <Helpline className="landing-helpline" />
                </div>
                <div className="nav-actions">
                    <LanguageSelector />
                    <button className="nav-button nav-button-secondary" onClick={() => openAuth("login")}>{t('Login')}</button>
                    <button className="nav-button" onClick={() => openAuth("register")}>{t('Register')}</button>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-copy">
                    <span className="eyebrow">{t('Circular supply chain platform')}</span>
                    <h2>{t('Turn leftover materials into useful inventory, fast.')}</h2>
                    <p>
                        {t('A platform for suppliers, buyers, and volunteers with role-based access, JWT authentication, and a live circular materials marketplace.')}
                    </p>

                    <div className="hero-actions">
                        <button className="hero-button" onClick={() => openAuth("register")}>{t('Get Started')}</button>
                        <button className="hero-button hero-button-muted" onClick={() => openAuth("login")}>{t('I already have an account')}</button>
                    </div>

                    {message ? <p className="message">{t(message)}</p> : null}
                </div>

                {showAuth ? (
                    <AuthPanel
                        mode={mode}
                        form={form}
                        onFieldChange={updateField}
                        onClose={() => setShowAuth(false)}
                        onSubmit={onSubmit}
                    />
                ) : (
                    <div className="feature-grid">
                        <article className="feature-card">
                            <h3>{t('Supplier')}</h3>
                            <p>{t('List extra stock, fabric scraps, and reusable material.')}</p>
                        </article>
                        <article className="feature-card">
                            <h3>{t('Buyer')}</h3>
                            <p>{t('Discover available material inventory and place requests quickly.')}</p>
                        </article>
                        <article className="feature-card">
                            <h3>{t('Volunteer')}</h3>
                            <p>{t('Coordinate collection, sorting, and community distribution.')}</p>
                        </article>
                    </div>
                )}
            </section>
            <GlobalAssistant />
        </main>
    );
};

export default LandingPage;
