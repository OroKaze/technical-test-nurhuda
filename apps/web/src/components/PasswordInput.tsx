import { forwardRef, useState, type InputHTMLAttributes } from 'react';

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`field-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <div className="password-wrapper">
        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className="field-input password-input"
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      {error && <span className="field-error" role="alert">{error}</span>}
      {hint && !error && <span className="field-hint">{hint}</span>}
    </div>
  );
});
