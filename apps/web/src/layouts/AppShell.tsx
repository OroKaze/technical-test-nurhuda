import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuthSession } from '../lib/auth-session';
import { useToast } from '../components/Toast';

const DEXA_HEADER_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIgf4smg6Moot6ti7iADPQ-zipbOP3OEVbJhLIARj2C_1-2Hf7Ejj_WRi4IJc3P6F-F73ckztvhImEaL9glgTFyh281JvR3Ck0DUti4Uw5EkjfGtoGsf038Ap6ha_Wi_1CQG2KrskpQ5v8EunoemVQ9DdAere-DTaf7ceTDGIT9YY8-Z6iUHq6OtepxJ9_4g7CnR1CrrrbUMT7GXacIb-yFWG_U6AAKOcO4lyLafqE-B4ksweJA4iNRODZQ3o6zHc5ovo';

export interface NavItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

interface AppShellProps {
  navItems: NavItem[];
  title?: string;
  children: React.ReactNode;
}

export function AppShell({ navItems, title, children }: AppShellProps) {
  const user = getStoredUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  function handleLogout() {
    clearAuthSession();
    showToast('info', 'Berhasil Keluar', 'Sesi login Anda telah diakhiri.');
    navigate('/login', { replace: true });
  }

  const isHrd = user?.role === 'HRD';

  return (
    <div className="shell-layout">
      {/* Top Header Navbar */}
      <header className="shell-header-dexa">
        <div className="shell-header-inner">
          <div className="shell-header-brand">
            <img src={DEXA_HEADER_LOGO} alt="Dexa Group Logo" className="shell-brand-logo" />
            <div className="shell-brand-divider" />
            <span className="shell-portal-title">
              {isHrd ? 'HR PORTAL' : 'EMPLOYEE PORTAL'}
            </span>
            <span className={`shell-role-pill ${isHrd ? 'pill-hrd' : 'pill-employee'}`}>
              {user?.role || 'USER'}
            </span>
          </div>

          <div className="shell-header-actions">
            <div className="shell-user-profile">
              <span className="shell-user-email">{user?.email}</span>
            </div>
            <button
              type="button"
              className="shell-btn-logout"
              onClick={handleLogout}
              aria-label="Keluar dari portal"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ width: 15, height: 15 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="shell-nav-tabs" aria-label="Navigasi Menu Utama">
        <div className="shell-nav-inner">
          <ul className="nav-tab-list">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <li key={item.to} className="nav-tab-item">
                  <Link
                    to={item.to}
                    className={`nav-tab-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon && <span className="nav-tab-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="shell-content-canvas">
        {title && (
          <div className="shell-view-header">
            <h1 className="shell-view-title">{title}</h1>
          </div>
        )}
        <div className="shell-view-body">{children}</div>
      </main>

      {/* Corporate Footer */}
      <footer className="shell-footer-dexa">
        <div className="shell-footer-inner">
          <div className="footer-copyright">
            <strong>Dexa Group</strong>
            <span className="footer-dot">•</span>
            <span>© 2026 PT Dexa Medica. Hak Cipta Dilindungi.</span>
          </div>
          <div className="footer-portal-note">
            Portal Presensi Karyawan &amp; Kepegawaian (WIB)
          </div>
        </div>
      </footer>
    </div>
  );
}
