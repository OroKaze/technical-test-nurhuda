import { useState, type FormEvent } from 'react';
import { Button } from './Button';
import { getTodayJakarta, getFirstDayOfCurrentMonthJakarta } from '../lib/datetime';

export interface DateRangeFilterProps {
  initialFrom?: string;
  initialTo?: string;
  onApply: (from?: string, to?: string) => void;
  loading?: boolean;
}

export function DateRangeFilter({
  initialFrom,
  initialTo,
  onApply,
  loading = false,
}: DateRangeFilterProps) {
  const [from, setFrom] = useState(initialFrom ?? '');
  const [to, setTo] = useState(initialTo ?? '');
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (from && to && from > to) {
      setValidationError('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
      return;
    }

    onApply(from || undefined, to || undefined);
  }

  function handleReset() {
    setFrom('');
    setTo('');
    setValidationError('');
    onApply(undefined, undefined);
  }

  function handleThisMonth() {
    const start = getFirstDayOfCurrentMonthJakarta();
    const end = getTodayJakarta();
    setFrom(start);
    setTo(end);
    setValidationError('');
    onApply(start, end);
  }

  return (
    <form className="date-filter-card" onSubmit={handleSubmit}>
      <div className="date-filter-row">
        <div className="date-field">
          <label htmlFor="filter-from">Dari Tanggal</label>
          <input
            id="filter-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="field-input date-input"
          />
        </div>

        <div className="date-field">
          <label htmlFor="filter-to">Sampai Tanggal</label>
          <input
            id="filter-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="field-input date-input"
          />
        </div>

        <div className="date-filter-actions">
          <Button type="submit" size="sm" loading={loading}>
            Terapkan Filter
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleThisMonth}>
            Bulan Ini
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {validationError && (
        <p className="filter-error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
