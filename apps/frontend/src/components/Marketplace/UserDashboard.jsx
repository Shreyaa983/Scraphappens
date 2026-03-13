import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAchievementProgressApi, getMyCircularScoreApi, getMyMaterials, getMyOrdersApi } from '../../api';
import { loadStoredPlacedTrees, loadStoredUnlockedPlants, TREE_VARIANTS } from '../../utils/gardenRewards';
import { useTranslation } from '../../hooks/useTranslation';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function UserDashboard({ token, user }) {
  const { t } = useTranslation();
  const [circularScore, setCircularScore] = useState(null);
  const [achievementProgress, setAchievementProgress] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [listedCount, setListedCount] = useState(0);
  const [placedPlants, setPlacedPlants] = useState([]);
  const [unlockedPlants, setUnlockedPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = user?.id || user?.sub || 'guest';

  useEffect(() => {
    setPlacedPlants(loadStoredPlacedTrees(userId));
    setUnlockedPlants(loadStoredUnlockedPlants(userId));
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [scoreRes, progressRes, ordersRes, materialsRes] = await Promise.allSettled([
        getMyCircularScoreApi(token),
        getAchievementProgressApi(token),
        getMyOrdersApi(token),
        getMyMaterials(token),
      ]);

      if (scoreRes.status === 'fulfilled') {
        setCircularScore(scoreRes.value.score || null);
      }

      if (progressRes.status === 'fulfilled') {
        setAchievementProgress(progressRes.value.progress || null);
      }

      if (ordersRes.status === 'fulfilled') {
        setOrderCount((ordersRes.value.orders || []).length);
      }

      if (materialsRes.status === 'fulfilled') {
        setListedCount((materialsRes.value.materials || []).length);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(t('Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  };

  // --- All derived values and memos BEFORE any early returns (Rules of Hooks) ---
  const circularScoreValue = toNumber(circularScore?.circular_score, 0);
  const currentExchanges = toNumber(achievementProgress?.current_exchanges, toNumber(circularScore?.items_reused, 0));
  const wasteSavedKg = toNumber(circularScore?.waste_saved_kg, 0);
  const treesPlanted = toNumber(circularScore?.trees_planted, 0);

  const allPlants = useMemo(() => [...placedPlants, ...unlockedPlants], [placedPlants, unlockedPlants]);

  const uniqueAchievementPlants = useMemo(() => {
    const seen = new Set();
    const unique = [];

    for (const plant of allPlants) {
      const key = plant.achievementId || plant.id;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(plant);
    }

    return unique;
  }, [allPlants]);

  const treesEarned = Math.max(treesPlanted, uniqueAchievementPlants.length);
  const nextMilestone = t(achievementProgress?.next_achievement?.name) || t('Seed Planter');
  const nextMilestoneTarget = toNumber(achievementProgress?.next_achievement?.required_exchanges, 0);
  const milestoneProgress = nextMilestoneTarget > 0 ? Math.min((currentExchanges / nextMilestoneTarget) * 100, 100) : 100;

  const scoreBreakdown = [
    { label: t('Rating Contribution'), value: toNumber(circularScore?.score_breakdown?.rating_score, 0), max: 30 },
    { label: t('Exchange Contribution'), value: toNumber(circularScore?.score_breakdown?.exchange_score, 0), max: 30 },
    { label: t('Waste Reuse Contribution'), value: toNumber(circularScore?.score_breakdown?.waste_score, 0), max: 20 },
    { label: t('Garden Growth Contribution'), value: toNumber(circularScore?.score_breakdown?.tree_score, 0), max: 20 },
  ];

  const plantBadges = useMemo(() => {
    const unlocked = uniqueAchievementPlants.slice(0, 5).map((plant, index) => ({
      key: plant.id || `unlocked-${index}`,
      icon: plant.icon || TREE_VARIANTS[index % TREE_VARIANTS.length].icon,
      name: plant.label || 'Achievement Plant',
      description: plant.achievement || plant.achievementDetails?.description || 'Unlocked through circular action',
      locked: false,
    }));

    const placeholders = Array.from({ length: Math.max(0, 5 - unlocked.length) }).map((_, index) => ({
      key: `locked-${index}`,
      icon: '○',
      name: t('Locked Plant'),
      description: t('Complete exchanges to unlock new plants.'),
      locked: true,
    }));

    return [...unlocked, ...placeholders];
  }, [uniqueAchievementPlants]);

  // Early return AFTER all hooks
  if (loading) return <div className="loading-shell">{t("Loading your dashboard…")}</div>;

  return (
    <div className="user-dashboard-page">
      {error ? <div className="dashboard-inline-error">{error}</div> : null}

      <header className="user-dashboard-header">
        <h3>{t("My Dashboard")}</h3>
        <p>{t("Track your circular impact, achievements, and sustainability progress.")}</p>
      </header>

      <section className="impact-summary-grid">
        <article className="impact-summary-card">
          <span className="impact-summary-icon">◻</span>
          <div className="impact-summary-value">{currentExchanges}</div>
          <div className="impact-summary-label">{t("Materials Exchanged")}</div>
        </article>

        <article className="impact-summary-card">
          <span className="impact-summary-icon">◈</span>
          <div className="impact-summary-value">{wasteSavedKg.toFixed(1)} {t("kg")}</div>
          <div className="impact-summary-label">{t("Waste Diverted from Landfill")}</div>
        </article>

        <article className="impact-summary-card">
          <span className="impact-summary-icon">◉</span>
          <div className="impact-summary-value">{treesEarned}</div>
          <div className="impact-summary-label">{t("Trees Earned")}</div>
        </article>

        <article className="impact-summary-card">
          <span className="impact-summary-icon">◎</span>
          <div className="impact-summary-value">{circularScoreValue} / 100</div>
          <div className="impact-summary-label">{t("Circular Score")}</div>
        </article>
      </section>

      <section className="dashboard-two-col-grid">
        <article className="dashboard-report-card">
          <h4>{t("Circular Score")}</h4>
          <p className="dashboard-muted-copy">
            {t("This score reflects your sustainability impact based on exchanges, reuse, ratings, and achievements.")}
          </p>

          <div className="dashboard-score-value">{circularScoreValue} / 100</div>

          <div className="dashboard-score-milestone">
            <span>{t("Next milestone")}: {nextMilestone}</span>
            <span>{nextMilestoneTarget > 0 ? `${currentExchanges}/${nextMilestoneTarget}` : t('Complete')}</span>
          </div>

          <div className="dashboard-progress-track">
            <div className="dashboard-progress-fill" style={{ width: `${milestoneProgress}%` }} />
          </div>
        </article>

        <article className="dashboard-report-card">
          <h4>{t("Score Breakdown")}</h4>
          <div className="dashboard-breakdown-list">
            {scoreBreakdown.map((item) => (
              <div key={item.label} className="dashboard-breakdown-item">
                <div className="dashboard-breakdown-row">
                  <span>{item.label}</span>
                  <span>{item.value} / {item.max}</span>
                </div>
                <div className="dashboard-progress-track">
                  <div className="dashboard-progress-fill" style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-two-col-grid">
        <article className="dashboard-report-card">
          <h4>{t("Garden Achievements")}</h4>
          <div className="dashboard-plant-badge-row">
            {plantBadges.map((badge) => (
              <article key={badge.key} className={`dashboard-plant-badge${badge.locked ? ' dashboard-plant-badge-locked' : ''}`}>
                <span className="dashboard-plant-icon">{badge.icon}</span>
                <div>
                  <strong>{t(badge.name)}</strong>
                  <p>{t(badge.description)}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="dashboard-report-card garden-preview-card">
          <h4>{t("Garden Preview")}</h4>
          <div className="garden-preview-strip">
            {plantBadges.slice(0, 6).map((badge) => (
              <span key={`preview-${badge.key}`} className={`garden-preview-icon${badge.locked ? ' locked' : ''}`}>
                {badge.icon}
              </span>
            ))}
          </div>
          <p className="dashboard-muted-copy">{t("See your current garden and place newly unlocked plants.")}</p>
          <Link to="/garden" className="dashboard-cta-link">{t("View My Garden")}</Link>
        </article>
      </section>

      <section className="dashboard-report-card">
        <h4>{t("Marketplace Activity")}</h4>
        <div className="dashboard-activity-grid">
          <article className="dashboard-activity-card">
            <div className="dashboard-activity-value">{orderCount}</div>
            <div className="dashboard-activity-label">{t("Recent Orders")}</div>
          </article>
          <article className="dashboard-activity-card">
            <div className="dashboard-activity-value">{listedCount}</div>
            <div className="dashboard-activity-label">{t("Materials Listed")}</div>
          </article>
          <article className="dashboard-activity-card">
            <div className="dashboard-activity-value">{currentExchanges}</div>
            <div className="dashboard-activity-label">{t("Recent Exchanges")}</div>
          </article>
        </div>
      </section>
    </div>
  );
}
