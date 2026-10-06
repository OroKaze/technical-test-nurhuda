import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { ErrorState } from '../../components/FeedbackStates';
import {
  formatDateJakarta,
  formatTimeJakarta,
  getFirstDayOfCurrentMonthJakarta,
  getTodayJakarta,
} from '../../lib/datetime';

interface AdminAttendanceRow {
  id: string;
  employeeId: string;
  attendanceDate: string;
  attendanceTime: string;
  status: 'CHECK_IN' | 'CHECK_OUT';
}

interface AdminAttendanceResponse {
  data: AdminAttendanceRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

interface EmployeeLookupItem {
  id: string;
  userId: string;
  fullName: string;
  companyEmail: string;
  position: string;
}

export function AttendanceMonitorPage() {
  const [attendance, setAttendance] = useState<AdminAttendanceRow[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Map<string, EmployeeLookupItem>>(new Map());
  const [employeesList, setEmployeesList] = useState<EmployeeLookupItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState(getFirstDayOfCurrentMonthJakarta());
  const [to, setTo] = useState(getTodayJakarta());

  async function loadData(fromDate = from, toDate = to, empId = selectedEmployeeId) {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.set('from', fromDate);
    if (toDate) queryParams.set('to', toDate);
    if (empId) queryParams.set('employeeId', empId);
    queryParams.set('limit', '200');

    try {
      const [attRes, empRes] = await Promise.all([
        api.get<AdminAttendanceResponse>(`/api/v1/admin/attendance?${queryParams.toString()}`),
        api.get<{ data: EmployeeLookupItem[] }>('/api/v1/admin/employees?limit=200'),
      ]);

      setAttendance(attRes.data);

      const map = new Map<string, EmployeeLookupItem>();
      empRes.data.forEach((e) => {
        map.set(e.userId, e);
        map.set(e.id, e);
      });
      setEmployeesMap(map);
      setEmployeesList(empRes.data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || 'Gagal memuat catatan absensi karyawan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    void loadData(from, to, selectedEmployeeId);
  }

  return (
    <div className="admin-page-container">
      <section className="card workspace-card">
        {/* Header Section */}
        <header className="card-header-clean">
          <h2 className="card-section-title">Monitoring Presensi Karyawan</h2>
          <p className="card-section-desc">
            Rekapitulasi catatan kehadiran seluruh karyawan harian realtime.
          </p>
        </header>

        {/* Toolbar Filter */}
        <form onSubmit={handleFilterSubmit} className="attendance-filter-toolbar-dexa">
          <div className="toolbar-fields-group">
            <div className="toolbar-field">
              <label htmlFor="filterFromDate" className="toolbar-label">Dari Tanggal:</label>
              <input
                id="filterFromDate"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="toolbar-input"
              />
            </div>

            <div className="toolbar-field">
              <label htmlFor="filterToDate" className="toolbar-label">Sampai Tanggal:</label>
              <input
                id="filterToDate"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="toolbar-input"
              />
            </div>

            <div className="toolbar-field">
              <label htmlFor="selectEmployee" className="toolbar-label">Karyawan:</label>
              <select
                id="selectEmployee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="toolbar-select"
              >
                <option value="">Semua Karyawan ({employeesList.length})</option>
                {employeesList.map((emp) => (
                  <option key={emp.id} value={emp.userId || emp.id}>
                    {emp.fullName} ({emp.position})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-apply-filter-dexa">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Terapkan Filter</span>
          </button>
        </form>

        {/* Data Table */}
        {error ? (
          <ErrorState
            title="Gagal Memuat Absensi"
            message={error}
            onRetry={() => loadData(from, to, selectedEmployeeId)}
          />
        ) : (
          <div className="table-wrapper-dexa">
            <table className="table-dexa">
              <thead>
                <tr>
                  <th scope="col">TANGGAL</th>
                  <th scope="col">NAMA KARYAWAN</th>
                  <th scope="col">JABATAN</th>
                  <th scope="col">WAKTU (WIB)</th>
                  <th scope="col">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">Memuat catatan kehadiran...</td>
                  </tr>
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">
                      Belum ada aktivitas check-in atau check-out yang tercatat untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  attendance.map((item) => {
                    const emp = employeesMap.get(item.employeeId);
                    const isCheckIn = item.status === 'CHECK_IN';

                    return (
                      <tr key={item.id}>
                        <td className="font-semibold text-slate-900">
                          {formatDateJakarta(item.attendanceDate)}
                        </td>
                        <td>
                          {emp ? (
                            <div>
                              <div className="font-semibold text-slate-900">{emp.fullName}</div>
                              <div className="text-xs text-slate-500 font-mono">{emp.companyEmail}</div>
                            </div>
                          ) : (
                            <span className="text-muted font-mono text-xs">{item.employeeId.slice(0, 8)}...</span>
                          )}
                        </td>
                        <td>
                          {emp ? (
                            <span className="badge-dexa badge-dexa-neutral">{emp.position}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="font-mono font-medium">
                          {formatTimeJakarta(item.attendanceTime)} WIB
                        </td>
                        <td>
                          {isCheckIn ? (
                            <span className="badge-dexa badge-dexa-success">
                              <span className="badge-dot dot-success" />
                              Masuk (Check-In)
                            </span>
                          ) : (
                            <span className="badge-dexa badge-dexa-danger">
                              <span className="badge-dot dot-danger" />
                              Pulang (Check-Out)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="table-footer-status">
              <span>Menampilkan {attendance.length} catatan aktivitas absensi</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
