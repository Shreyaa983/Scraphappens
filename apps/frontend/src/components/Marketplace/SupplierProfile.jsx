import { useState, useEffect } from 'react';

const API_BASE = "http://localhost:4002/api";

async function apiFetch(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function SupplierProfile({ supplierId, token, onBack }) {
  const [supplier, setSupplier] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [circularScore, setCircularScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supplierId) return;
    fetchSupplierData();
  }, [supplierId]);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reviewsData, statsData, scoreData] = await Promise.allSettled([
        apiFetch(`/reviews/supplier/${supplierId}`, token),
        apiFetch(`/reviews/stats/${supplierId}`, token),
        apiFetch(`/reputation/score/${supplierId}`, token),
      ]);

      if (
        reviewsData.status === 'rejected' &&
        statsData.status === 'rejected' &&
        scoreData.status === 'rejected'
      ) {
        throw new Error('All supplier profile requests failed');
      }

      if (reviewsData.status === 'fulfilled') {
        setReviews(reviewsData.value.reviews || []);
        // Extract supplier info from first review or stats
        const s = reviewsData.value.seller;
        if (s) setSupplier(s);
      }
      if (statsData.status === 'fulfilled') {
        const s = statsData.value.stats;
        if (s?.seller) setSupplier(s.seller);
      }
      if (scoreData.status === 'fulfilled') {
        setCircularScore(scoreData.value.score);
      }
    } catch (err) {
      setError('Failed to load supplier profile');
    } finally {
      setLoading(false);
    }
  };

  const trustGrade = circularScore
    ? circularScore.circular_score >= 80 ? { label: 'Platinum', color: '#e2e8f0' }
      : circularScore.circular_score >= 60 ? { label: 'Gold', color: '#fbbf24' }
      : circularScore.circular_score >= 40 ? { label: 'Silver', color: '#94a3b8' }
      : { label: 'Bronze', color: '#b45309' }
    : null;

  if (loading) return <div className="loading-shell">Loading supplier profile…</div>;
  if (error) return <div style={{ color: '#ef4444', padding: 20 }}>{error}</div>;

  const displayName = supplier?.name || `Seller #${String(supplierId).slice(0, 6)}`;
  const circularScoreValue = toNumber(circularScore?.circular_score, 0);
  const avgRating = toNumber(circularScore?.rating, 0);
  const itemsReused = toNumber(circularScore?.items_reused, 0);
  const treesPlanted = toNumber(circularScore?.trees_planted, 0);

  return (
    <div className="my-listings-page">
      {/* Back + Header */}
      <div className="my-listings-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && (
          <button className="nav-button nav-button-secondary" onClick={onBack} style={{ flexShrink: 0 }}>
            ← Back
          </button>
        )}
        <div>
          <h3 style={{ margin: 0 }}>{displayName}</h3>
          {supplier?.city && (
            <p className="my-listings-sub" style={{ marginTop: 4 }}>
              📍 {supplier.city}{supplier.state ? `, ${supplier.state}` : ''}
            </p>
          )}
        </div>
        {trustGrade && (
          <span
            style={{
              marginLeft: 'auto',
              padding: '4px 14px',
              borderRadius: 20,
              background: `${trustGrade.color}22`,
              border: `1px solid ${trustGrade.color}`,
              color: trustGrade.color,
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            {trustGrade.label} Supplier
          </span>
        )}
      </div>

      {/* Circular Score stats */}
      {circularScore && (
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <p className="detail-card-heading">Circular Reputation Score</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div className="stat-chip">
              <span className="stat-chip-val">{circularScoreValue}</span>
              <span className="stat-chip-label">Score /100</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-val">{avgRating > 0 ? avgRating.toFixed(1) : '—'} ⭐</span>
              <span className="stat-chip-label">Avg Rating</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-val">{itemsReused}</span>
              <span className="stat-chip-label">Exchanges</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-val">{treesPlanted} 🌳</span>
              <span className="stat-chip-label">Trees Planted</span>
            </div>
          </div>

          {/* Badges */}
          {circularScore.badges?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {circularScore.badges.map(badge => (
                <span key={badge} style={{
                  padding: '3px 12px',
                  border: '1px solid #22c55e',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  color: '#22c55e',
                  background: '#22c55e10',
                }}>✓ {badge}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="dashboard-card">
        <p className="detail-card-heading">Customer Reviews ({reviews.length})</p>
        {reviews.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No reviews yet for this supplier.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {reviews.map(review => (
              <div key={review.id} style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{review.buyer_name || 'Anonymous'}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 10 }}>
                      {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <span style={{ color: '#fbbf24', fontSize: '1rem' }}>
                    {'★'.repeat(toNumber(review.star_rating, 0))}{'☆'.repeat(Math.max(0, 5 - toNumber(review.star_rating, 0)))}
                  </span>
                </div>
                {review.comment && <p style={{ margin: '6px 0', fontSize: 14, color: '#d1d5db' }}>{review.comment}</p>}
                <div style={{ display: 'flex', gap: 16 }}>
                  <small style={{ color: '#6b7280' }}>Quality: {toNumber(review.material_quality_rating, 0)}/5</small>
                  <small style={{ color: '#6b7280' }}>Delivery: {toNumber(review.delivery_experience_rating, 0)}/5</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
