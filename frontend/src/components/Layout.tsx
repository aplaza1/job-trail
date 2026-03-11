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
            <span className="logo-icon">🛤️</span>
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
    </div>
  );
}
