import { useState } from 'react';
import { submitReviewApi } from '../../api';

export default function ReviewForm({ orderId, sellerId, token, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [qualityRating, setQualityRating] = useState(5);
  const [qualityHover, setQualityHover] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [deliveryHover, setDeliveryHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const StarRow = ({ value, hoverVal, onChange, onHover, size = 24 }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: size, color: star <= (hoverVal || value) ? '#fbbf24' : '#374151',
            transition: 'color 0.15s',
          }}
        >★</button>
      ))}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitReviewApi(
        {
          order_id: orderId,
          seller_id: sellerId,
          star_rating: rating,
          comment: comment.trim() || null,
          delivery_experience_rating: deliveryRating,
          material_quality_rating: qualityRating,
        },
        token,
      );
      setSuccess(true);
      setTimeout(() => onSubmitted?.(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0', color: '#22c55e' }}>
        <div style={{ fontSize: '2rem' }}>✅</div>
        <p style={{ fontWeight: 600, margin: '8px 0 4px' }}>Review Submitted!</p>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Thank you for helping other users make informed choices.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
      {error && <div style={{ color: '#ef4444', fontSize: 14 }}>{error}</div>}

      <div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 6 }}>Overall Rating *</p>
        <StarRow value={rating} hoverVal={hover} onChange={setRating} onHover={setHover} size={28} />
      </div>

      <div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 6 }}>Material Quality</p>
        <StarRow value={qualityRating} hoverVal={qualityHover} onChange={setQualityRating} onHover={setQualityHover} />
      </div>

      <div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 6 }}>Delivery Experience</p>
        <StarRow value={deliveryRating} hoverVal={deliveryHover} onChange={setDeliveryRating} onHover={setDeliveryHover} />
      </div>

      <div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 6 }}>Comments (Optional)</p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us about your experience…"
          rows={3}
          maxLength={500}
          style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
        />
        <small style={{ color: '#6b7280' }}>{comment.length}/500</small>
      </div>

      <button
        type="submit"
        disabled={loading || !sellerId}
        className="nav-button"
        style={{
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: '#fff', border: 'none', padding: '11px 24px',
          borderRadius: 10, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1, justifySelf: 'start',
        }}
      >
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
