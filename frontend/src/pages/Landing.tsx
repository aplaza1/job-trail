import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function Landing() {
  return (
    <Layout>
      <div className="landing-page">
        <div className="landing-hero">
          <div className="landing-badge">Open-Source Job Tracker</div>
          <h1 className="landing-headline">
            Built as a joke.<br />
            Kept because it works.<br />
            <span className="landing-headline--accent">Free forever.</span>
          </h1>
          <p className="landing-desc">
            This started as alexappliesforjobs.com, complete with fake donations and other
            nonsense. People found it genuinely useful, so now it&apos;s open source and available
            for anyone who wants a clean way to track applications and interviews.
          </p>
          <div className="landing-cta">
            <Link to="/signup" className="btn btn-primary btn--lg">Create Account</Link>
            <Link to="/login" className="btn btn-secondary btn--lg">Sign In</Link>
          </div>
          <p className="landing-footnote">
            No monetization plan · Open source · Free forever
          </p>
          <p className="landing-footnote" style={{ marginTop: '0.5rem' }}>
            Origin story:{' '}
            <a href="https://alexappliesforjobs.com" target="_blank" rel="noreferrer">
              alexappliesforjobs.com
            </a>
          </p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">🧾</div>
            <h3 className="feature-title">Actually Useful</h3>
            <p className="feature-desc">Log applications, statuses, dates, and links without spreadsheet chaos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3 className="feature-title">Interview Calendar</h3>
            <p className="feature-desc">See your work-week schedule at a glance and keep interview prep on track.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3 className="feature-title">Share If You Want</h3>
            <p className="feature-desc">Optional public link for friends, mentors, or anyone cheering you on.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
