import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken, getStoredUser } from '../lib/auth-session';

export interface ProtectedRouteProps {
  requiredRole?: 'EMPLOYEE' | 'HRD';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If user is logged in but belongs to different role
    return (
      <div className="unauthorized-card">
        <h2>Akses Ditolak</h2>
        <p>Akun Anda ({user.role}) tidak memiliki izin untuk membuka halaman ini.</p>
        <button
          className="btn btn-secondary"
          onClick={() => {
            sessionStorage.clear();
            window.location.href = '/login';
          }}
        >
          Ganti Akun
        </button>
      </div>
    );
  }

  return <Outlet />;
}
