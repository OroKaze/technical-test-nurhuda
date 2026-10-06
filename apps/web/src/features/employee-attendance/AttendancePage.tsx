import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { PhotoUpload } from '../employee-profile/PhotoUpload';
import { PhoneForm } from '../employee-profile/PhoneForm';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { CalendarIcon, ClockIcon } from '../../components/Icons';
import {
  formatDateJakarta,
  formatTimeJakarta,
  parseAttendanceDateTimeJakarta,
  getTodayJakarta,
  getFirstDayOfCurrentMonthJakarta,
} from '../../lib/datetime';

interface AttendanceSummaryItem {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface EmployeeProfileData {
  id: string;
  fullName: string;
  companyEmail: string;
  photoUrl: string | null;
  position: string;
  phoneNumber: string | null;
}

export function AttendancePage() {
  const { showToast } = useToast();

  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance state
  const [todayRecord, setTodayRecord] = useState<AttendanceSummaryItem | null>(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [actionLoading, setActionLoading] = useState<'checkIn' | 'checkOut' | null>(null);

  // Summary state
  const [summaryList, setSummaryList] = useState<AttendanceSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [filterFrom, setFilterFrom] = useState(getFirstDayOfCurrentMonthJakarta());
  const [filterTo, setFilterTo] = useState(getTodayJakarta());

  // Profile state
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load today status
  async function loadTodayStatus() {
    setLoadingToday(true);
    const today = getTodayJakarta();
    try {
      const summary = await api.get<AttendanceSummaryItem[]>(
        `/api/v1/attendance/summary?from=${today}&to=${today}`,
      );
      const match = summary.find((item) => item.date.slice(0, 10) === today);
      setTodayRecord(match ?? null);
    } catch {
      setTodayRecord(null);
    } finally {
      setLoadingToday(false);
    }
  }

  // Load summary records
  async function loadSummary(from = filterFrom, to = filterTo) {
    setSummaryLoading(true);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const data = await api.get<AttendanceSummaryItem[]>(
        `/api/v1/attendance/summary${qs.toString() ? `?${qs.toString()}` : ''}`,
      );
      setSummaryList(data);
    } catch {
      setSummaryList([]);
    } finally {
      setSummaryLoading(false);
    }
  }

  // Load profile data
  async function loadProfile() {
    setProfileLoading(true);
    try {
      const data = await api.get<EmployeeProfileData>('/api/v1/me/profile');
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    void loadTodayStatus();
    void loadSummary(filterFrom, filterTo);
    void loadProfile();
  }, []);

  async function handleCheckIn() {
    setActionLoading('checkIn');
    try {
      await api.post('/api/v1/attendance/check-in');
      showToast('success', 'Check-In Berhasil', 'Waktu check-in Anda telah dicatat di sistem.');
      await Promise.all([loadTodayStatus(), loadSummary(filterFrom, filterTo)]);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.isConflict || parsed.code === 'ALREADY_CHECKED_IN') {
        showToast('warning', 'Sudah Check-In', 'Anda sudah melakukan check-in untuk hari kerja ini.');
      } else {
        showToast('error', 'Gagal Check-In', parsed.message);
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCheckOut() {
    setActionLoading('checkOut');
    try {
      await api.post('/api/v1/attendance/check-out');
      showToast('success', 'Check-Out Berhasil', 'Waktu check-out Anda telah dicatat di sistem.');
      await Promise.all([loadTodayStatus(), loadSummary(filterFrom, filterTo)]);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'CHECK_IN_REQUIRED') {
        showToast('warning', 'Perhatian', 'Anda harus melakukan check-in terlebih dahulu.');
      } else if (parsed.isConflict || parsed.code === 'ALREADY_CHECKED_OUT') {
        showToast('warning', 'Sudah Check-Out', 'Anda sudah melakukan check-out untuk hari kerja ini.');
      } else {
        showToast('error', 'Gagal Check-Out', parsed.message);
      }
    } finally {
      setActionLoading(null);
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    void loadSummary(filterFrom, filterTo);
  }

  const hasCheckedIn = Boolean(todayRecord?.checkIn);
  const hasCheckedOut = Boolean(todayRecord?.checkOut);

  return (
    <div className="employee-workspace-grid">
      {/* LEFT COLUMN: Presensi & Rekapitulasi (7 Cols) */}
      <div className="workspace-main-column">
        {/* KARTU 1: Presensi Hari Ini */}
        <section className="card workspace-card">
          <header className="card-header-between">
            <div>
              <h2 className="card-section-title">Presensi Hari Ini</h2>
              <p className="card-section-desc">Catat kehadiran harian Anda tepat waktu</p>
            </div>
            <div className="date-badge-pill">
              <span className="date-badge-icon">
                <CalendarIcon style={{ width: 14, height: 14 }} />
              </span>
              <span className="date-badge-text">{formatDateJakarta(currentTime)}</span>
            </div>
          </header>

          {/* Digital Clock Display */}
          <div className="clock-banner-box">
            <div className="clock-timezone-label">WAKTU INDONESIA BARAT (WIB)</div>
            <div className="clock-digit-display" aria-live="polite">
              {formatTimeJakarta(currentTime)} WIB
            </div>
          </div>

          {/* Action Buttons: Check-In & Check-Out */}
          <div className="attendance-buttons-row">
            <button
              type="button"
              disabled={loadingToday || hasCheckedIn || actionLoading === 'checkIn'}
              onClick={handleCheckIn}
              className={`btn-punch btn-punch-in ${hasCheckedIn ? 'is-disabled' : ''}`}
            >
              {actionLoading === 'checkIn' ? (
                <span>Memproses...</span>
              ) : hasCheckedIn ? (
                <>
                  <span>✓ Check-In ({formatTimeJakarta(todayRecord!.checkIn)})</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Check-In</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={
                loadingToday ||
                !hasCheckedIn ||
                hasCheckedOut ||
                actionLoading === 'checkOut'
              }
              onClick={handleCheckOut}
              className={`btn-punch btn-punch-out ${
                hasCheckedOut || !hasCheckedIn ? 'is-disabled' : ''
              }`}
            >
              {actionLoading === 'checkOut' ? (
                <span>Memproses...</span>
              ) : hasCheckedOut ? (
                <>
                  <span>✓ Check-Out ({formatTimeJakarta(todayRecord!.checkOut)})</span>
                </>
              ) : !hasCheckedIn ? (
                <span>Check-In Diperlukan Dulu</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Check-Out</span>
                </>
              )}
            </button>
          </div>

          {/* Panel Status Log Presensi Hari Ini */}
          <div className="status-log-panel">
            <h3 className="status-log-title">STATUS LOG PRESENSI HARI INI</h3>
            <div className="status-log-grid">
              <div className="status-log-item">
                <span className="log-item-label">Jam Check-In</span>
                <span className="log-item-value">
                  {todayRecord?.checkIn ? `${formatTimeJakarta(todayRecord.checkIn)} WIB` : '-- : --'}
                </span>
              </div>
              <div className="status-log-item">
                <span className="log-item-label">Jam Check-Out</span>
                <span className="log-item-value">
                  {todayRecord?.checkOut ? `${formatTimeJakarta(todayRecord.checkOut)} WIB` : '-- : --'}
                </span>
              </div>
              <div className="status-log-item">
                <span className="log-item-label">Status Kehadiran</span>
                <div className="log-badge-wrapper">
                  {hasCheckedIn && hasCheckedOut ? (
                    <span className="badge-dexa badge-dexa-success">
                      <span className="badge-dot dot-success" />
                      Lengkap
                    </span>
                  ) : hasCheckedIn ? (
                    <span className="badge-dexa badge-dexa-success">
                      <span className="badge-dot dot-success" />
                      Sudah Check-In
                    </span>
                  ) : (
                    <span className="badge-dexa badge-dexa-muted">
                      <span className="badge-dot dot-muted" />
                      Belum Check-In
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KARTU 2: Rekapitulasi Presensi */}
        <section className="card workspace-card">
          <header className="card-header-clean">
            <h2 className="card-section-title">Rekapitulasi Presensi</h2>
            <p className="card-section-desc">Riwayat kehadiran dan status harian karyawan</p>
          </header>

          {/* Filter Bar */}
          <form onSubmit={handleFilterSubmit} className="summary-filter-bar">
            <div className="filter-inputs-row">
              <div className="filter-field">
                <label htmlFor="filterFrom" className="filter-label">Dari Tanggal</label>
                <input
                  id="filterFrom"
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="filter-date-input"
                />
              </div>
              <div className="filter-field">
                <label htmlFor="filterTo" className="filter-label">Sampai Tanggal</label>
                <input
                  id="filterTo"
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="filter-date-input"
                />
              </div>
            </div>
            <button type="submit" disabled={summaryLoading} className="btn-filter-dexa">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
            </button>
          </form>

          {/* Tabel Riwayat Presensi (3 Kolom: Masuk, Pulang, Status Kehadiran) */}
          <div className="table-wrapper-dexa">
            <table className="table-dexa">
              <thead>
                <tr>
                  <th scope="col">Masuk</th>
                  <th scope="col">Pulang</th>
                  <th scope="col">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {summaryLoading ? (
                  <tr>
                    <td colSpan={3} className="table-empty-cell">Memuat riwayat kehadiran...</td>
                  </tr>
                ) : summaryList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="table-empty-cell">Tidak ada catatan absensi pada periode ini.</td>
                  </tr>
                ) : (
                  summaryList.map((item) => {
                    const isComplete = Boolean(item.checkIn && item.checkOut);
                    const isInOnly = Boolean(item.checkIn && !item.checkOut);

                    const checkInParsed = parseAttendanceDateTimeJakarta(item.checkIn, item.date);
                    const checkOutParsed = parseAttendanceDateTimeJakarta(item.checkOut, item.date);

                    return (
                      <tr key={item.date}>
                        <td>
                          {checkInParsed ? (
                            <div className="attendance-datetime-block">
                              <span className="attendance-date-val">{checkInParsed.date}</span>
                              <span className="attendance-time-pill" title={`Waktu Masuk: ${checkInParsed.time} WIB`}>
                                <ClockIcon className="time-icon" />
                                <span>{checkInParsed.time}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="attendance-empty-val">-- : --</span>
                          )}
                        </td>
                        <td>
                          {checkOutParsed ? (
                            <div className="attendance-datetime-block">
                              <span className="attendance-date-val">{checkOutParsed.date}</span>
                              <span className="attendance-time-pill" title={`Waktu Pulang: ${checkOutParsed.time} WIB`}>
                                <ClockIcon className="time-icon" />
                                <span>{checkOutParsed.time}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="attendance-empty-val">-- : --</span>
                          )}
                        </td>
                        <td>
                          {isComplete ? (
                            <span className="badge-dexa badge-dexa-success">
                              <span className="badge-dot dot-success" />
                              Lengkap
                            </span>
                          ) : isInOnly ? (
                            <span className="badge-dexa badge-dexa-warning">
                              <span className="badge-dot dot-warning" />
                              Belum Check-Out
                            </span>
                          ) : (
                            <span className="badge-dexa badge-dexa-muted">
                              <span className="badge-dot dot-muted" />
                              Tidak Hadir
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Informasi Profil Karyawan (5 Cols) */}
      <aside className="workspace-side-column">
        <section className="card workspace-card">
          <header className="card-header-clean">
            <h2 className="card-section-title">Informasi Profil Karyawan</h2>
            <p className="card-section-desc">Kelola identitas dan informasi kontak aktif</p>
          </header>

          {profileLoading ? (
            <div className="profile-loading-box">Memuat data profil...</div>
          ) : profile ? (
            <div className="profile-card-content">
              {/* Foto Profil & Upload Button */}
              <div className="profile-avatar-center">
                <PhotoUpload
                  currentPhotoUrl={profile.photoUrl}
                  fullName={profile.fullName}
                  onPhotoUpdated={(newUrl) => {
                    setProfile((prev) => (prev ? { ...prev, photoUrl: newUrl } : null));
                  }}
                />
              </div>

              {/* Data Diri (Read-only) */}
              <div className="profile-fields-stack">
                <div className="profile-field-group">
                  <label className="field-label-muted">Nama Lengkap</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.fullName}
                    className="field-input-readonly"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="field-label-muted">Email Perusahaan</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.companyEmail}
                    className="field-input-readonly"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="field-label-muted">Posisi / Jabatan</label>
                  <input
                    type="text"
                    readOnly
                    value={profile.position}
                    className="field-input-readonly"
                  />
                </div>
              </div>

              {/* Edit Nomor Telepon Form */}
              <div className="profile-divider-line" />
              <div className="profile-phone-section">
                <PhoneForm
                  currentPhone={profile.phoneNumber}
                  onPhoneUpdated={(newPhone) => {
                    setProfile((prev) => (prev ? { ...prev, phoneNumber: newPhone } : null));
                  }}
                />
              </div>

              {/* Keamanan Akun (Ubah Password) */}
              <div className="profile-divider-line" />
              <div className="security-account-card">
                <div>
                  <h4 className="security-title">Keamanan Akun</h4>
                  <p className="security-desc">Kelola kata sandi akun Anda untuk perlindungan akses.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="btn-change-password-dexa"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Ubah Password</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-error-box">Gagal memuat informasi profil.</div>
          )}
        </section>
      </aside>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
