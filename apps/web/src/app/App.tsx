import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AppShell } from '../layouts/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { AttendancePage } from '../features/employee-attendance/AttendancePage';
import { SummaryPage } from '../features/employee-attendance/SummaryPage';
import { ProfilePage } from '../features/employee-profile/ProfilePage';
import { EmployeesPage } from '../features/admin-employees/EmployeesPage';
import { AttendanceMonitorPage } from '../features/admin-attendance/AttendanceMonitorPage';
import { useNotificationListener } from '../features/notifications/useNotificationListener';
import {
  ClockIcon,
  ChartBarIcon,
  UserIcon,
  UsersIcon,
  ClipboardCheckIcon,
} from '../components/Icons';

const mode = import.meta.env.VITE_APP_MODE === 'hrd' ? 'hrd' : 'employee';

const employeeNavItems = [
  {
    to: '/employee/attendance',
    label: 'Absensi Hari Ini',
    icon: <ClockIcon style={{ width: 16, height: 16 }} />,
  },
  {
    to: '/employee/attendance-summary',
    label: 'Ringkasan Absensi',
    icon: <ChartBarIcon style={{ width: 16, height: 16 }} />,
  },
  {
    to: '/employee/profile',
    label: 'Profil Saya',
    icon: <UserIcon style={{ width: 16, height: 16 }} />,
  },
];

const hrdNavItems = [
  {
    to: '/admin/employees',
    label: 'Manajemen Karyawan',
    icon: <UsersIcon style={{ width: 16, height: 16 }} />,
  },
  {
    to: '/admin/attendance',
    label: 'Monitoring Absensi',
    icon: <ClipboardCheckIcon style={{ width: 16, height: 16 }} />,
  },
];

function EmployeeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AppShell navItems={employeeNavItems} title={title}>
      {children}
    </AppShell>
  );
}

function HrdLayout({ title, children }: { title: string; children: React.ReactNode }) {
  useNotificationListener();
  return (
    <AppShell navItems={hrdNavItems} title={title}>
      {children}
    </AppShell>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Employee Mode Routes */}
        <Route element={<ProtectedRoute requiredRole="EMPLOYEE" />}>
          <Route
            path="/employee/attendance"
            element={
              <EmployeeLayout title="Absensi Hari Ini">
                <AttendancePage />
              </EmployeeLayout>
            }
          />
          <Route
            path="/employee/attendance-summary"
            element={
              <EmployeeLayout title="Ringkasan Absensi Bulanan">
                <SummaryPage />
              </EmployeeLayout>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <EmployeeLayout title="Profil Karyawan">
                <ProfilePage />
              </EmployeeLayout>
            }
          />
        </Route>

        {/* HRD Mode Routes */}
        <Route element={<ProtectedRoute requiredRole="HRD" />}>
          <Route
            path="/admin/employees"
            element={
              <HrdLayout title="Manajemen Data Karyawan">
                <EmployeesPage />
              </HrdLayout>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <HrdLayout title="Monitoring Absensi Karyawan">
                <AttendanceMonitorPage />
              </HrdLayout>
            }
          />
        </Route>

        {/* Root redirect depending on mode */}
        <Route
          path="*"
          element={
            <Navigate
              to={mode === 'hrd' ? '/admin/employees' : '/employee/attendance'}
              replace
            />
          }
        />
      </Routes>
    </ToastProvider>
  );
}
