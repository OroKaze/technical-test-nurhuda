import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { ErrorState } from '../../components/FeedbackStates';
import { SearchIcon, FilterIcon, XMarkIcon, CalendarIcon } from '../../components/Icons';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter 1: Server-side Date Period Filter
  const [from, setFrom] = useState(getFirstDayOfCurrentMonthJakarta());
  const [to, setTo] = useState(getTodayJakarta());

  // Filter 2: Client-side Instant Filter (Contains) & Status Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');

  async function loadData(fromDate = from, toDate = to) {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.set('from', fromDate);
    if (toDate) queryParams.set('to', toDate);
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

  function handleDateFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from && to && from > to) {
      setError("Rentang tanggal tidak valid: 'Dari Tanggal' harus sebelum atau sama dengan 'Sampai Tanggal'.");
      return;
    }
    void loadData(from, to);
  }

  function handleResetDateFilter() {
    const defaultFrom = getFirstDayOfCurrentMonthJakarta();
    const defaultTo = getTodayJakarta();
    setFrom(defaultFrom);
    setTo(defaultTo);
    void loadData(defaultFrom, defaultTo);
  }

  function handlePresetToday() {
    const today = getTodayJakarta();
    setFrom(today);
    setTo(today);
    void loadData(today, today);
  }

  function handlePresetThisMonth() {
    const defaultFrom = getFirstDayOfCurrentMonthJakarta();
    const defaultTo = getTodayJakarta();
    setFrom(defaultFrom);
    setTo(defaultTo);
    void loadData(defaultFrom, defaultTo);
  }

  // Real-time contains filter logic across multiple fields
  const filteredAttendance = attendance.filter((item) => {
    // 1. Status Filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }

    // 2. Search Contains Filter
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const emp = employeesMap.get(item.employeeId);
    const fullName = emp?.fullName?.toLowerCase() ?? '';
    const position = emp?.position?.toLowerCase() ?? '';
    const email = emp?.companyEmail?.toLowerCase() ?? '';
    const empId = item.employeeId.toLowerCase();

    // Check if name, position, email, or id contains search query
    return (
      fullName.includes(query) ||
      position.includes(query) ||
      email.includes(query) ||
      empId.includes(query)
    );
  });

  // Calculate status counts based on current fetched date data
  const checkInCount = attendance.filter((a) => a.status === 'CHECK_IN').length;
  const checkOutCount = attendance.filter((a) => a.status === 'CHECK_OUT').length;

  const isDefaultDate = from === getFirstDayOfCurrentMonthJakarta() && to === getTodayJakarta();

  return (
    <div className="admin-page-container">
      <section className="card workspace-card">
        {/* Header Section */}
        <header className="card-header-clean">
          <h2 className="card-section-title">Monitoring Presensi Karyawan</h2>
          <p className="card-section-desc">
            Rekapitulasi catatan kehadiran seluruh karyawan harian secara realtime.
          </p>
        </header>

        {/* Filter Container: Separated into Date Filter & Instant Search */}
        <div className="attendance-filter-container">
          {/* Form Filter 1: Periode Tanggal Presensi (Server-side) */}
          <form onSubmit={handleDateFilterSubmit} className="attendance-date-toolbar-dexa">
            <div className="toolbar-title-badge">
              <CalendarIcon style={{ width: 16, height: 16, color: 'var(--brand-navy)' }} />
              <span>Periode Tanggal</span>
            </div>

            <div className="toolbar-fields-group">
              <div className="toolbar-field">
                <label htmlFor="filterFromDate" className="toolbar-label">Dari:</label>
                <input
                  id="filterFromDate"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="toolbar-input"
                />
              </div>

              <div className="toolbar-field">
                <label htmlFor="filterToDate" className="toolbar-label">Sampai:</label>
                <input
                  id="filterToDate"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="toolbar-input"
                />
              </div>

              <div className="toolbar-actions-group">
                <button type="submit" disabled={loading} className="btn-apply-filter-dexa">
                  <FilterIcon style={{ width: 14, height: 14 }} />
                  <span>Terapkan Periode</span>
                </button>

                <button
                  type="button"
                  onClick={handlePresetToday}
                  disabled={loading}
                  className="btn-reset-filter-dexa"
                  title="Tampilkan data hari ini saja"
                >
                  Hari Ini
                </button>

                <button
                  type="button"
                  onClick={handlePresetThisMonth}
                  disabled={loading}
                  className="btn-reset-filter-dexa"
                  title="Tampilkan data bulan ini"
                >
                  Bulan Ini
                </button>

                {!isDefaultDate && (
                  <button
                    type="button"
                    onClick={handleResetDateFilter}
                    disabled={loading}
                    className="btn-reset-filter-dexa"
                    title="Kembalikan ke rentang default"
                  >
                    <XMarkIcon style={{ width: 13, height: 13 }} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Form Filter 2: Pencarian Instan Nama / Jabatan & Status Tabs (Client-side Contains) */}
          <div className="attendance-search-toolbar-dexa">
            {/* Search Input Box with Contains Matching */}
            <div className="search-field-container">
              <span className="search-field-icon">
                <SearchIcon style={{ width: 16, height: 16 }} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama Karyawan atau Jabatan (misal: Budi, Developer, QA)..."
                className="search-field-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-field-clear"
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <XMarkIcon style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>

            {/* Quick Status Filter Pills */}
            <div className="status-filter-pills" role="tablist" aria-label="Filter Status Kehadiran">
              <button
                type="button"
                className={`status-pill-btn ${statusFilter === 'ALL' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                <span>Semua Status</span>
                <span className="pill-count">{attendance.length}</span>
              </button>

              <button
                type="button"
                className={`status-pill-btn ${statusFilter === 'CHECK_IN' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('CHECK_IN')}
              >
                <span>Masuk (Check-In)</span>
                <span className="pill-count">{checkInCount}</span>
              </button>

              <button
                type="button"
                className={`status-pill-btn ${statusFilter === 'CHECK_OUT' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('CHECK_OUT')}
              >
                <span>Pulang (Check-Out)</span>
                <span className="pill-count">{checkOutCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter & Count Information */}
        {(searchQuery.trim() || statusFilter !== 'ALL') && (
          <div className="filter-results-info">
            <div>
              <span>Hasil pencarian filter: <strong>{filteredAttendance.length}</strong> data ditemukan</span>
              {searchQuery.trim() && (
                <span style={{ marginLeft: 8 }} className="filter-keyword-badge">
                  Kata kunci: &ldquo;{searchQuery.trim()}&rdquo;
                  <button type="button" onClick={() => setSearchQuery('')} title="Hapus filter kata kunci">
                    <XMarkIcon style={{ width: 12, height: 12 }} />
                  </button>
                </span>
              )}
            </div>
            {(searchQuery.trim() || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
                style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Bersihkan filter pencarian
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        {error ? (
          <ErrorState
            title="Gagal Memuat Absensi"
            message={error}
            onRetry={() => loadData(from, to)}
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
                      Belum ada aktivitas presensi yang tercatat untuk periode tanggal terpilih ({formatDateJakarta(from)} – {formatDateJakarta(to)}).
                    </td>
                  </tr>
                ) : filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-empty-cell">
                      <div style={{ padding: '16px 0' }}>
                        <p style={{ fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                          Tidak ada karyawan atau jabatan yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                        </p>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                          Coba periksa ejaan kata kunci atau bersihkan kotak pencarian.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                          className="btn-reset-filter-dexa"
                          style={{ margin: '0 auto' }}
                        >
                          Hapus Filter Pencarian
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((item) => {
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
              <span>
                Menampilkan <strong>{filteredAttendance.length}</strong> dari <strong>{attendance.length}</strong> catatan aktivitas presensi
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
