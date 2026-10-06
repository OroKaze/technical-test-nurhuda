import { useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { parseApiError } from '../../lib/api-error';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { DataTable, type Column } from '../../components/DataTable';
import { ErrorState } from '../../components/FeedbackStates';
import {
  formatDateJakarta,
  formatTimeJakarta,
  getFirstDayOfCurrentMonthJakarta,
  getTodayJakarta,
} from '../../lib/datetime';

interface AttendanceSummaryItem {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export function SummaryPage() {
  const [data, setData] = useState<AttendanceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFrom, setCurrentFrom] = useState(getFirstDayOfCurrentMonthJakarta());
  const [currentTo, setCurrentTo] = useState(getTodayJakarta());

  async function loadSummary(from?: string, to?: string) {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);

    const qs = queryParams.toString();
    const url = `/api/v1/attendance/summary${qs ? `?${qs}` : ''}`;

    try {
      const result = await api.get<AttendanceSummaryItem[]>(url);
      setData(result);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || 'Gagal memuat ringkasan absensi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary(currentFrom, currentTo);
  }, []);

  function handleFilterApply(from?: string, to?: string) {
    setCurrentFrom(from ?? getFirstDayOfCurrentMonthJakarta());
    setCurrentTo(to ?? getTodayJakarta());
    void loadSummary(from, to);
  }

  const columns: Column<AttendanceSummaryItem>[] = [
    {
      key: 'date',
      header: 'Tanggal',
      render: (item) => <strong>{formatDateJakarta(item.date)}</strong>,
    },
    {
      key: 'checkIn',
      header: 'Waktu Check-In',
      render: (item) => (
        <span>
          {item.checkIn ? (
            <span className="time-badge badge-in">📥 {formatTimeJakarta(item.checkIn)}</span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Waktu Check-Out',
      render: (item) => (
        <span>
          {item.checkOut ? (
            <span className="time-badge badge-out">📤 {formatTimeJakarta(item.checkOut)}</span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Kehadiran',
      render: (item) => {
        if (item.checkIn && item.checkOut) {
          return <span className="badge badge-success">Lengkap</span>;
        }
        if (item.checkIn && !item.checkOut) {
          return <span className="badge badge-warning">Belum Check-Out</span>;
        }
        return <span className="badge badge-secondary">Tidak Hadir</span>;
      },
    },
  ];

  return (
    <div className="summary-page-container">
      <section className="card filter-section">
        <header className="card-header">
          <span className="eyebrow">FILTER DATA</span>
          <h2 className="card-title">Filter Rentang Tanggal</h2>
        </header>

        <DateRangeFilter
          initialFrom={currentFrom}
          initialTo={currentTo}
          onApply={handleFilterApply}
          loading={loading}
        />
      </section>

      <section className="card table-section">
        <header className="card-header">
          <span className="eyebrow">HASIL LAPORAN</span>
          <h2 className="card-title">Ringkasan Kehadiran Anda ({data.length} Hari)</h2>
        </header>

        {error ? (
          <ErrorState
            title="Gagal Memuat Ringkasan"
            message={error}
            onRetry={() => loadSummary(currentFrom, currentTo)}
          />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(item) => item.date}
            loading={loading}
            emptyTitle="Belum Ada Catatan Absensi"
            emptyDescription="Tidak ditemukan catatan kehadiran pada rentang tanggal yang dipilih."
            caption="Ringkasan kehadiran karyawan"
          />
        )}
      </section>
    </div>
  );
}
