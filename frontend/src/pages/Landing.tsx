import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function Landing() {
  return (
    <Layout>
      <div className="landing-page">
        <div className="landing-hero">
          <div className="landing-badge">Job Search Tracker</div>
          <h1 className="landing-headline">
            Track your job search.<br />
            Stay organized.<br />
            <span className="landing-headline--accent">Share your journey.</span>
          </h1>
          <p className="landing-desc">
            Job Trail helps you track every application, schedule interviews, and share your
            progress — all in one place. Stop losing track of where you applied and focus
            on landing your next role.
          </p>
          <div className="landing-cta">
            <Link to="/signup" className="btn btn-primary btn--lg">Sign Up Free</Link>
            <Link to="/login" className="btn btn-secondary btn--lg">Sign In</Link>
          </div>
          <p className="landing-footnote">No credit card required · Free to get started</p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3 className="feature-title">Track Applications</h3>
            <p className="feature-desc">Log every application with status, method, and notes. Never lose track again.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3 className="feature-title">Interview Calendar</h3>
            <p className="feature-desc">See your upcoming interviews in a clean weekly calendar view. Stay prepared.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3 className="feature-title">Share Your Progress</h3>
            <p className="feature-desc">Generate a public link to share your job search progress with mentors or friends.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
