import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function Landing() {
  return (
    <Layout>
      <div className="landing-page">
        <div className="landing-hero">
          <div className="landing-badge">Free &amp; Open-Source Job Application Tracker</div>
          <h1 className="landing-headline">
            Free job application tracker.<br />
            Organize interviews, follow-ups,<br />
            <span className="landing-headline--accent">and your whole job search.</span>
          </h1>
          <p className="landing-desc">
            Job Trail is a free, open-source job application tracker for anyone in an active job search.
            Log applications, track interview dates, monitor follow-ups, and optionally share your
            progress — all without a subscription or spreadsheet.
          </p>
          <p className="landing-desc" style={{ marginTop: '0.5rem' }}>
            This started as{' '}
            <a href="https://alexappliesforjobs.com" target="_blank" rel="noreferrer">
              alexappliesforjobs.com
            </a>
            , complete with fake donations and other nonsense. People found it genuinely useful,
            so now it&apos;s open source and available for anyone.
          </p>
          <div className="landing-cta">
            <Link to="/signup" className="btn btn-primary btn--lg">Create Account</Link>
            <Link to="/login" className="btn btn-secondary btn--lg">Sign In</Link>
          </div>
          <p className="landing-footnote">
            <a href="https://github.com/aplaza1/job-trail" target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">🧾</div>
            <h3 className="feature-title">Application Tracker</h3>
            <p className="feature-desc">Log every job application with status, company, date applied, and direct link. No spreadsheet chaos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3 className="feature-title">Interview Tracker</h3>
            <p className="feature-desc">See all your upcoming interviews in a work-week calendar view. Keep interview prep on track.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3 className="feature-title">Share Your Job Search</h3>
            <p className="feature-desc">Generate a public link to share your job search dashboard with friends, mentors, or recruiters.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
