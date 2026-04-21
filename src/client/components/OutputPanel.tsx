import type { ExecResult } from '../types';
import styles from '../styles/components/OutputPanel.module.css';

interface Props {
  result: ExecResult | null;
  loading: boolean;
  error: string | null;
}

export function OutputPanel({ result, loading, error }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Output</span>
        {result && (
          <span
            className={`${styles.exitCode} ${result.exitCode === 0 ? styles.success : styles.failure}`}
          >
            EXIT {result.exitCode}
          </span>
        )}
      </div>
      <div className={styles.output}>
        {loading && (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            Executing...
          </div>
        )}
        {error && <span className={styles.stderr}>{error}</span>}
        {result && !loading && (
          <>
            {result.stdout && <span className={styles.stdout}>{result.stdout}</span>}
            {result.stderr && <span className={styles.stderr}>{result.stderr}</span>}
            {!result.stdout && !result.stderr && (
              <span className={styles.empty}>No output</span>
            )}
          </>
        )}
        {!result && !loading && !error && (
          <span className={styles.empty}>Run code to see output</span>
        )}
      </div>
    </div>
  );
}
