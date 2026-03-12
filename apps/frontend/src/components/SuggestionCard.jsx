import React from 'react';

export default function SuggestionCard({ text, index }) {
    return (
        <div className="glass-suggestion-card">
            <div className="card-header">
                <span className="idea-number">IDEA {index + 1}</span>
            </div>
            <p className="card-text">{text}</p>

            <style jsx>{`
        .glass-suggestion-card {
          /* Glassmorphism Effect */
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          min-height: 140px;
        }

        .glass-suggestion-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }

        .idea-number {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }

        .card-text {
          font-size: 1rem;
          line-height: 1.5;
          color: #ffffff; /* Change to #333 if your background is light */
          margin: 0;
          font-weight: 500;
        }
      `}</style>
        </div>
    );
}