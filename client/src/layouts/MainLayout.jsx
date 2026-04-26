import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { ChevronDown, Send } from 'lucide-react';

const MainLayout = ({ children }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();

  return (
    <div className="layout-root">

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header className="site-header">
        <nav className="container-lg nav-bar">
          <div className="nav-left">
            <Link to="/" className="nav-logo-link">
              <Logo size={32} />
              <span className="nav-logo-text">SevaSetu</span>
            </Link>
            
            <div className="nav-links-desktop">
              <a href="#features" className="nav-link">Features</a>
              <a href="#workflow" className="nav-link">How It Works</a>
              <a href="#roles" className="nav-link">Roles</a>
              <a href="#about" className="nav-link">About</a>
              <div className="nav-dropdown-trigger">
                <span className="nav-link">Resources <ChevronDown size={14} /></span>
              </div>
            </div>
          </div>

          <div className="nav-actions">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="nav-link">Sign in</Link>
                <Link to="/register" className="btn-primary nav-cta">Join the Mission</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn-primary nav-cta">Dashboard</Link>
                <div className="nav-user-section">
                  <button onClick={logout} className="nav-link">Logout</button>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── Page Content ────────────────────────────────────────────── */}
      <main className="layout-main">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container-lg">
          <div className="footer-grid">
            <div className="footer-col-brand">
              <div className="footer-brand">
                <Logo size={28} />
                <span className="footer-brand-text">SevaSetu</span>
              </div>
              <p className="footer-desc">
                An open initiative for community resilience and coordinated humanitarian response.
              </p>
            </div>
            
            <div className="footer-col">
              <h4>Platform</h4>
              <nav>
                <a href="#">Features</a>
                <a href="#">How It Works</a>
                <a href="#">Roles</a>
                <a href="#">Open Source</a>
              </nav>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <nav>
                <a href="#">Help Center</a>
                <a href="#">Docs</a>
                <a href="#">Blog</a>
                <a href="#">Case Studies</a>
              </nav>
            </div>

            <div className="footer-col">
              <h4>Company</h4>
              <nav>
                <a href="#">About Us</a>
                <a href="#">Contact</a>
                <a href="#">Careers</a>
              </nav>
            </div>

            <div className="footer-col-newsletter">
              <h4>Stay Updated</h4>
              <p>Get updates on new features and impact stories.</p>
              <div className="footer-newsletter-form">
                <input type="email" placeholder="Enter your email" />
                <button type="button"><Send size={16} /></button>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">
              © 2026 SevaSetu Open Initiative — Community resilience, powered by AI.
            </p>
            <div className="footer-legal">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default MainLayout;
