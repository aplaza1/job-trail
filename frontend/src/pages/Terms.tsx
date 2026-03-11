import { Layout } from '../components/Layout';

export function Terms() {
  return (
    <Layout>
      <div className="page-wrapper">
        <div className="legal-page">
          <h1 className="page-title">Terms of Service</h1>
          <p className="legal-updated">Last updated: March 11, 2026</p>

          <section className="legal-section">
            <h2>Use of Service</h2>
            <p>
              Job Trail is provided for personal job-search organization. You agree to use the
              service lawfully and not attempt to disrupt or abuse it.
            </p>
          </section>

          <section className="legal-section">
            <h2>Account Responsibility</h2>
            <p>
              You are responsible for maintaining account credentials and activity performed under
              your account.
            </p>
          </section>

          <section className="legal-section">
            <h2>Availability</h2>
            <p>
              The service may change over time and can be updated, limited, or discontinued
              without prior notice.
            </p>
          </section>

          <section className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              The service is provided "as is" without warranties. To the maximum extent permitted
              by law, liability is limited for indirect or consequential damages.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
