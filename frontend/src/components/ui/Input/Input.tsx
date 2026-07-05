import { forwardRef, useId } from 'react';
import styles from './Input.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputSize = 'sm' | 'md' | 'lg';
export type InputStatus = 'default' | 'error' | 'success';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visible label rendered above the input */
  label?: string;
  /** Helper text rendered below the input */
  hint?: string;
  /** Error message — also sets status to 'error' when provided */
  error?: string;
  size?: InputSize;
  status?: InputStatus;
  /** Icon or element rendered inside the left edge */
  iconLeft?: React.ReactNode;
  /** Icon or element rendered inside the right edge */
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      status = 'default',
      iconLeft,
      iconRight,
      fullWidth = false,
      disabled,
      className,
      id: idProp,
      ...rest
    },
    ref,
  ) => {
    // Always have a stable id for label association, even if none is passed
    const generatedId = useId();
    const id = idProp ?? generatedId;

    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    // An error prop always wins over an explicit status prop
    const resolvedStatus: InputStatus = error ? 'error' : status;

    const wrapperClass = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
    ]
      .filter(Boolean)
      .join(' ');

    const fieldClass = [
      styles.field,
      styles[size],
      styles[resolvedStatus],
      iconLeft ? styles.hasIconLeft : '',
      iconRight ? styles.hasIconRight : '',
      disabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}

        <div className={styles.inputRow}>
          {iconLeft && (
            <span className={styles.iconLeft} aria-hidden="true">
              {iconLeft}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            className={fieldClass}
            disabled={disabled}
            aria-invalid={resolvedStatus === 'error'}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null]
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...rest}
          />

          {iconRight && (
            <span className={styles.iconRight} aria-hidden="true">
              {iconRight}
            </span>
          )}
        </div>

        {/* Error takes priority over hint */}
        {error ? (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className={styles.hint}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
