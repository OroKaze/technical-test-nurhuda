import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api-client';
import { setAuthSession, type AuthUser } from '../../lib/auth-session';
import { parseApiError } from '../../lib/api-error';
import { useToast } from '../../components/Toast';
import { AlertCircleIcon } from '../../components/Icons';

const DEXA_HEADER_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCIgf4smg6Moot6ti7iADPQ-zipbOP3OEVbJhLIARj2C_1-2Hf7Ejj_WRi4IJc3P6F-F73ckztvhImEaL9glgTFyh281JvR3Ck0DUti4Uw5EkjfGtoGsf038Ap6ha_Wi_1CQG2KrskpQ5v8EunoemVQ9DdAere-DTaf7ceTDGIT9YY8-Z6iUHq6OtepxJ9_4g7CnR1CrrrbUMT7GXacIb-yFWG_U6AAKOcO4lyLafqE-B4ksweJA4iNRODZQ3o6zHc5ovo';

const DEXA_CARD_LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBGRV_rAp3_DeYsZAlEpFAyMdVXN3Yv4DYKJp3bifFPiPIMjnt0tEChZcicClubMfm1DPSyJXpzeoLLKJuBy6D6gmgrG2zLwsP_nsS7F5Jc4FpFugKonADOsNsmcNNifKPzFziQWkJEEOeyoVnYTVdMRkC0YBBAiwrfM6OjdUQVnWpY1pgd2LVS4cFVzQYQS5EMNiAqbcB0sqoc1bB5lCCvYaFsrHeGiehhcrSir1H_10xHayXe8Hih9eYwabp0G3uV_SA';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: 'EMPLOYEE' | 'HRD';
  };
}

export function LoginPage() {
  const mode = import.meta.env.VITE_APP_MODE === 'hrd' ? 'hrd' : 'employee';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>(
        '/api/v1/auth/login',
        { email: email.trim().toLowerCase(), password },
        { skipAuth: true },
      );

      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      };

      setAuthSession(response.accessToken, authUser);
      showToast('success', 'Login Berhasil', `Selamat datang kembali, ${authUser.email}!`);

      if (authUser.role === 'HRD') {
        navigate('/admin/employees', { replace: true });
      } else {
        navigate('/employee/attendance', { replace: true });
      }
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.isUnauthorized) {
        setErrorMessage('Email atau kata sandi tidak sesuai. Pastikan akun aktif.');
      } else if (parsed.code === 'INVALID_COMPANY_EMAIL') {
        setErrorMessage('Harus menggunakan email resmi perusahaan (@company.example).');
      } else {
        setErrorMessage(parsed.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(role: 'employee' | 'hrd') {
    if (role === 'employee') {
      setEmail('employee@company.example');
      setPassword('Employee123!');
    } else {
      setEmail('hrd@company.example');
      setPassword('HrdEmployee123!');
    }
  }

  return (
    <div className="dexa-login-layout">
      {/* Site Header */}
      <header className="dexa-site-header">
        <div className="dexa-header-inner">
          <div className="dexa-brand-wrap">
            <img src={DEXA_HEADER_LOGO} alt="Dexa Group Logo" className="dexa-header-logo" />
            <div className="dexa-header-divider" />
            <span className="dexa-header-portal-label">HR &amp; Attendance Portal</span>
          </div>
          <div className="dexa-header-badge">
            <span className="dexa-indicator-dot" />
            <span>{mode === 'hrd' ? 'HRD Management Mode' : 'Employee Self-Service (ESS)'}</span>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="dexa-auth-main">
        <section className="dexa-login-card">
          <header className="dexa-card-header">
            <img src={DEXA_CARD_LOGO} alt="Dexa Group" className="dexa-card-logo" />
            <h1 className="dexa-card-title">Portal Presensi &amp; Kepegawaian</h1>
            <p className="dexa-card-subtitle">
              {mode === 'hrd'
                ? 'Human Resources Administration System'
                : 'Employee Attendance & Self-Service (ESS)'}
            </p>
          </header>

          {errorMessage && (
            <div className="alert-box alert-error" role="alert">
              <AlertCircleIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="dexa-login-form">
            {/* Identifier (Email / NIK) Field */}
            <div className="dexa-input-group">
              <div className="dexa-input-label-row">
                <label htmlFor="identifier" className="dexa-input-label">
                  Email Perusahaan
                </label>
              </div>
              <div className="dexa-input-wrapper">
                <div className="dexa-input-icon-left">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    />
                  </svg>
                </div>
                <input
                  id="identifier"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@company.example"
                  required
                  autoComplete="email"
                  className="dexa-text-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="dexa-input-group">
              <div className="dexa-input-label-row">
                <label htmlFor="password" className="dexa-input-label">
                  Kata Sandi
                </label>
              </div>
              <div className="dexa-input-wrapper with-eye">
                <div className="dexa-input-icon-left">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="dexa-text-input"
                />
                <button
                  type="button"
                  className="dexa-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button type="submit" disabled={loading} className="dexa-submit-btn">
              {loading ? (
                <span>Memproses Verifikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Portal Absensi</span>
                  <svg
                    style={{ width: 16, height: 16 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Development Quick Fill Helpers */}
          <div className="dev-helper-box">
            <p className="dev-helper-title">Bantuan Pengujian Cepat (Dev):</p>
            <div className="dev-buttons">
              <button
                type="button"
                className="btn-quick-fill"
                onClick={() => handleQuickFill('employee')}
              >
                Isi Akun Employee
              </button>
              <button
                type="button"
                className="btn-quick-fill"
                onClick={() => handleQuickFill('hrd')}
              >
                Isi Akun HRD
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Site Footer */}
      <footer className="dexa-site-footer">
        <div className="dexa-footer-inner">
          <div>
            © 2026 <strong style={{ color: '#334155' }}>Dexa Group</strong>. Hak Cipta Dilindungi.
          </div>
          <div className="text-muted text-xs">
            Portal Resmi Presensi &amp; Kepegawaian (WIB)
          </div>
        </div>
      </footer>
    </div>
  );
}
