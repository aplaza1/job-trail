import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function NotFound() {
  return (
    <Layout>
      <div className="page-wrapper">
        <div className="not-found">
          <h2 className="not-found-title">Page Not Found</h2>
          <p className="not-found-desc">
            The page you requested does not exist.
          </p>
          <div className="form-actions" style={{ justifyContent: 'center', borderTop: 0, paddingTop: '1rem' }}>
            <Link to="/" className="btn btn-primary">Go Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
