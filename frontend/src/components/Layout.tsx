import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link to={user ? '/dashboard' : '/'} className="site-logo" onClick={closeMenu}>
            <svg className="logo-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="7" width="20" height="14" rx="2" fill="url(#lgrad)" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <polyline points="8,13 11,16 16,11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="lgrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4f46e5"/>
                    <stop offset="100%" stopColor="#7c3aed"/>
                  </linearGradient>
                </defs>
              </svg>
            <span className="logo-text">Job Trail</span>
          </Link>
          {!loading && (
            <>
              <button
                className="hamburger-btn"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span className={`hamburger-icon${menuOpen ? ' hamburger-icon--open' : ''}`} />
              </button>
              <nav className={`nav${menuOpen ? ' nav--open' : ''}`}>
                {user ? (
                  <>
                    <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
                    <Link to="/settings" className="nav-link" onClick={closeMenu}>Settings</Link>
                    <button className="nav-btn" onClick={() => { closeMenu(); handleLogout(); }}>Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="nav-link" onClick={closeMenu}>Sign In</Link>
                    <Link to="/signup" className="nav-btn nav-btn--primary" onClick={closeMenu}>Sign Up</Link>
                  </>
                )}
              </nav>
            </>
          )}
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <span className="site-footer-copy">© {new Date().getFullYear()} Job Trail</span>
          <div className="site-footer-links">
            <Link to="/privacy" className="site-footer-link">Privacy</Link>
            <Link to="/terms" className="site-footer-link">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
