import { useState, useEffect } from 'react';
import { getMyCircularScoreApi, getMyCouponsApi, getAchievementProgressApi } from '../../api';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function UserDashboard({ token }) {
  const [circularScore, setCircularScore] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [achievementProgress, setAchievementProgress] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [scoreRes, achieveRes, couponsRes] = await Promise.allSettled([
        getMyCircularScoreApi(token),
        getAchievementProgressApi(token),
        getMyCouponsApi(token),
      ]);
      if (scoreRes.status === 'fulfilled') setCircularScore(scoreRes.value.score);
      if (achieveRes.status === 'fulfilled') {
        const progress = achieveRes.value.progress || null;
        setAchievementProgress(progress);
        setAchievements(progress?.all_achievements || []);
      }
      if (couponsRes.status === 'fulfilled') setCoupons(couponsRes.value.coupons || []);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-shell">Loading your dashboard…</div>;

  const circularScoreValue = toNumber(circularScore?.circular_score, 0);
  const avgRating = toNumber(circularScore?.rating, 0);
  const itemsReused = toNumber(circularScore?.items_reused, 0);
  const wasteSavedKg = toNumber(circularScore?.waste_saved_kg, 0);
  const treesPlanted = toNumber(circularScore?.trees_planted, 0);

  return (
    <div className="my-listings-page">
      {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}

      <div className="my-listings-header">
        <h3>My Dashboard</h3>
        <p className="my-listings-sub">Your circular impact, achievements &amp; rewards.</p>
      </div>

      {achievementProgress && (
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <p className="detail-card-heading">Achievement Progress</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Current Exchanges</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{achievementProgress.current_exchanges ?? 0}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Next Achievement</div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                {achievementProgress.next_achievement?.name || 'All unlocked'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Circular Score Card */}
      {circularScore ? (
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <p className="detail-card-heading">Circular Score</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#22c55e', lineHeight: 1 }}>
                {circularScoreValue}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>out of 100</div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Avg Rating', val: `${avgRating.toFixed(1)} ⭐` },
                { label: 'Items Reused', val: itemsReused },
                { label: 'Waste Saved', val: `${wasteSavedKg.toFixed(1)} kg` },
                { label: 'Trees Planted', val: `${treesPlanted} 🌳` },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.label}</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Score breakdown bars */}
          {circularScore.score_breakdown && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 8 }}>Score Breakdown</p>
              {[
                { label: 'Rating', score: toNumber(circularScore.score_breakdown.rating_score, 0), max: 30 },
                { label: 'Exchanges', score: toNumber(circularScore.score_breakdown.exchange_score, 0), max: 30 },
                { label: 'Waste Saved', score: toNumber(circularScore.score_breakdown.waste_score, 0), max: 20 },
                { label: 'Trees', score: toNumber(circularScore.score_breakdown.tree_score, 0), max: 20 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ width: 80, fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{item.label}</span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6 }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: 'linear-gradient(90deg,#22c55e,#86efac)',
                      width: `${Math.min(((item.score || 0) / item.max) * 100, 100)}%`,
                    }} />
                  </div>
                  <span style={{ width: 48, fontSize: 12, textAlign: 'right', color: '#d1d5db' }}>{item.score}/{item.max}</span>
                </div>
              ))}
            </div>
          )}

          {/* Badges */}
          {circularScore.badges?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {circularScore.badges.map(badge => (
                <span key={badge} style={{
                  padding: '3px 12px', border: '1px solid #22c55e', borderRadius: 20,
                  fontSize: '0.78rem', color: '#22c55e', background: '#22c55e10',
                }}>✓ {badge}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <p className="detail-card-heading">Circular Score</p>
          <p style={{ color: '#9ca3af' }}>Complete your first exchange to receive a circular score!</p>
        </div>
      )}

      {/* Achievements Section */}
      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <p className="detail-card-heading">Achievements 🏆</p>
        {achievements.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No achievements yet. Start trading to unlock them!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {achievements.map(achievement => (
              <div key={achievement.id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: toNumber(achievement.progress, 0) >= 100 ? '1px solid rgba(34,197,94,0.45)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '12px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 6 }}>{achievement.icon_emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{achievement.name}</div>
                <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '4px 0 0' }}>{achievement.description}</p>
                <div style={{ marginTop: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(toNumber(achievement.progress, 0), 100)}%`,
                      height: '100%',
                      background: toNumber(achievement.progress, 0) >= 100 ? 'linear-gradient(90deg,#22c55e,#86efac)' : 'linear-gradient(90deg,#60a5fa,#93c5fd)',
                    }} />
                  </div>
                  <small style={{ color: toNumber(achievement.progress, 0) >= 100 ? '#22c55e' : '#9ca3af' }}>
                    {toNumber(achievement.progress, 0) >= 100
                      ? 'Unlocked'
                      : `${Math.round(toNumber(achievement.progress, 0))}% complete · target ${toNumber(achievement.required_exchanges, 0)} exchanges`}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coupon Wallet Section */}
      <div className="dashboard-card">
        <p className="detail-card-heading">Coupon Wallet 🎟️</p>
        {coupons.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>Complete more reuse transactions to unlock coupons! 🌱</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {coupons.map(coupon => (
              <div key={coupon.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px',
                border: '1px dashed rgba(34,197,94,0.4)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', color: '#22c55e' }}>{coupon.code}</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 }}>{coupon.description}</div>
                </div>
                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '1.1rem' }}>
                  {coupon.value ? `₹${coupon.value} off` : 'FREE'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
