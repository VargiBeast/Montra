import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';
import './PlusTeaser.css';

interface PlusTeaserProps {
  variant?: 'app' | 'web';
}

export function PlusTeaser({ variant = 'app' }: PlusTeaserProps) {
  const navigate = useNavigate();

  return (
    <section className={`plus-teaser plus-teaser--${variant}`}>
      <div className="plus-teaser__glow" aria-hidden />
      <div className="plus-teaser__badge">
        <Sparkles size={14} /> Plus
      </div>
      <h3>{t('home.plusTeaser.title')}</h3>
      <p>{t('home.plusTeaser.body')}</p>
      <div className="plus-teaser__preview" aria-hidden>
        <div className="plus-teaser__bar">
          <span style={{ width: '42%' }} />
          <label>Food</label>
        </div>
        <div className="plus-teaser__bar">
          <span style={{ width: '28%' }} />
          <label>Transport</label>
        </div>
        <div className="plus-teaser__bar">
          <span style={{ width: '18%' }} />
          <label>Shopping</label>
        </div>
      </div>
      <button
        type="button"
        className="plus-teaser__cta"
        onClick={() => navigate('/plus')}
      >
        {t('home.plusTeaser.cta')} <ArrowRight size={16} />
      </button>
    </section>
  );
}
