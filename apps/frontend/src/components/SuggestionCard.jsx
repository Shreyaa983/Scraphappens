import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function SuggestionCard({ text, index }) {
  const { t } = useTranslation();
    return (
        <div className="suggestion-card-wrapper">
            <div className="suggestion-card-header">
                <span className="suggestion-idea-badge">{t("Idea")} {index + 1}</span>
            </div>
            <p className="suggestion-card-text">{t(text)}</p>

            <style jsx>{`
        .suggestion-card-wrapper {
          background: var(--color-bg-secondary, #ffffff);
          border: 2px solid var(--color-border, #1a1a1a);
          border-radius: var(--radius-lg, 16px);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          min-height: 160px;
          box-shadow: var(--neo-shadow, 4px 4px 0px #1a1a1a);
          position: relative;
          overflow: hidden;
        }

        .suggestion-card-wrapper:hover {
          transform: translate(-2px, -2px);
          box-shadow: var(--neo-shadow-lg, 6px 6px 0px #1a1a1a);
          background: #ffffff;
        }

        .suggestion-idea-badge {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          background: var(--color-primary, #2d8659);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          display: inline-block;
        }

        .suggestion-card-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--color-text-primary, #1a1a1a);
          margin: 0;
          font-weight: 500;
        }

        /* Subtle decorative element */
        .suggestion-card-wrapper::after {
          content: '✨';
          position: absolute;
          bottom: -10px;
          right: -10px;
          font-size: 3rem;
          opacity: 0.05;
          transform: rotate(-15deg);
        }
      `}</style>
        </div>
    );
}