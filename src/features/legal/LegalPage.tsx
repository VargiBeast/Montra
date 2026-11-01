import { Link, useParams } from 'react-router-dom';
import './LegalPage.css';

type DocId = 'privacy' | 'terms' | 'refund';

const docs: Record<
  DocId,
  { title: string; updated: string; sections: { h: string; p: string[] }[] }
> = {
  privacy: {
    title: 'Privacy Policy',
    updated: '1 November 2026',
    sections: [
      {
        h: 'Who we are',
        p: [
          'Montra ("we", "us") provides a personal finance application at montra.cash. This policy explains what data we process and why.',
        ],
      },
      {
        h: 'Data we process',
        p: [
          'Account data from Google Sign-In (name, email, profile image if provided).',
          'Financial data you enter: transactions, goals, wishlist items, receipts and related metadata.',
          'Technical data needed to run the service (session tokens, basic device/browser information).',
        ],
      },
      {
        h: 'How we use data',
        p: [
          'To provide and improve Montra, authenticate you, store your financial records, and process Montra Plus subscriptions via Stripe.',
          'We do not sell your personal data. We do not show ads in the product based on your financial content.',
        ],
      },
      {
        h: 'Storage and security',
        p: [
          'Data is stored with Supabase (authenticated access and row-level security). Payment processing is handled by Stripe.',
          'You can request deletion of your account data by contacting us through the app or the contact details on montra.cash.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          'Depending on your location you may have rights to access, correct, export or delete personal data. Contact us to exercise these rights.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: '1 November 2026',
    sections: [
      {
        h: 'The service',
        p: [
          'Montra is a personal finance tool for tracking transactions, receipts, goals and related features. It is not a bank, investment advisor or tax authority.',
        ],
      },
      {
        h: 'Your account',
        p: [
          'You must use a valid Google account and keep access secure. You are responsible for activity under your account and for the accuracy of data you enter.',
        ],
      },
      {
        h: 'Acceptable use',
        p: [
          'Do not misuse the service, attempt unauthorized access, or use Montra for unlawful purposes. We may suspend accounts that abuse the platform.',
        ],
      },
      {
        h: 'Montra Plus',
        p: [
          'Paid features are offered as Montra Plus via Stripe. Pricing, trial length and billing intervals are shown at checkout. Subscriptions renew until cancelled.',
        ],
      },
      {
        h: 'Disclaimer',
        p: [
          'Montra is provided "as is". Insights and forecasts are informational only and may be incomplete. We are not liable for financial decisions you make based on the app.',
        ],
      },
    ],
  },
  refund: {
    title: 'Refund Policy',
    updated: '1 November 2026',
    sections: [
      {
        h: 'Trials',
        p: [
          'Montra Plus may include a free trial (for example 7 days) as shown at checkout. You can cancel during the trial so that you are not charged.',
        ],
      },
      {
        h: 'Subscriptions',
        p: [
          'Fees for Montra Plus are generally non-refundable once a paid period has started, except where required by law.',
          'If you believe you were charged in error, contact us promptly with your account email and approximate charge date.',
        ],
      },
      {
        h: 'How to cancel',
        p: [
          'You can manage or cancel your subscription through the Stripe customer portal or the account/billing options in Montra where available. Cancellation stops future renewals; it does not always refund the current period.',
        ],
      },
      {
        h: 'Contact',
        p: [
          'For billing questions, use the support options in the app or the contact information published on montra.cash.',
        ],
      },
    ],
  },
};

export function LegalPage() {
  const { doc } = useParams<{ doc: string }>();
  const id = (doc === 'privacy' || doc === 'terms' || doc === 'refund' ? doc : 'privacy') as DocId;
  const content = docs[id];

  return (
    <div className="legal">
      <header className="legal__header">
        <Link to="/" className="legal__brand">
          Montra
        </Link>
        <nav className="legal__nav">
          <Link to="/legal/privacy" className={id === 'privacy' ? 'is-active' : ''}>
            Privacy
          </Link>
          <Link to="/legal/terms" className={id === 'terms' ? 'is-active' : ''}>
            Terms
          </Link>
          <Link to="/legal/refund" className={id === 'refund' ? 'is-active' : ''}>
            Refunds
          </Link>
        </nav>
      </header>

      <article className="legal__article">
        <h1>{content.title}</h1>
        <p className="legal__updated">Last updated: {content.updated}</p>
        {content.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </section>
        ))}
      </article>

      <footer className="legal__footer">
        <Link to="/">← Back to Montra</Link>
      </footer>
    </div>
  );
}
