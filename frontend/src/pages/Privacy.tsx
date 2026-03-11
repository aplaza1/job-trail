import { Layout } from '../components/Layout';

export function Privacy() {
  return (
    <Layout>
      <div className="page-wrapper">
        <div className="legal-page">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="legal-updated">Last updated: March 11, 2026</p>

          <section className="legal-section">
            <h2>Information We Store</h2>
            <p>
              Job Trail stores your account email, profile settings, job applications,
              interview details, and optional public share link preferences.
            </p>
          </section>

          <section className="legal-section">
            <h2>How We Use Information</h2>
            <p>
              Data is used only to provide the product features: authentication, dashboard
              management, and optional public sharing when you enable it.
            </p>
          </section>

          <section className="legal-section">
            <h2>Data Sharing</h2>
            <p>
              Your data is not sold. Public visibility occurs only when you turn on your public
              dashboard, and only people with your share link can view it.
            </p>
          </section>

          <section className="legal-section">
            <h2>Data Deletion</h2>
            <p>
              You can permanently delete your account and data from Settings at any time.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
