import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link to={user ? '/dashboard' : '/'} className="site-logo">
            <span className="logo-icon">🛤️</span>
            <span className="logo-text">Job Trail</span>
          </Link>
          {!loading && (
            <nav className="nav">
              {user ? (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/settings" className="nav-link">Settings</Link>
                  <button className="nav-btn" onClick={handleLogout}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Sign In</Link>
                  <Link to="/signup" className="nav-btn nav-btn--primary">Sign Up</Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
