import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

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
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
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
