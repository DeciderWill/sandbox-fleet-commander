import type { SandboxInfo } from '../types';
import styles from '../styles/components/Header.module.css';

interface Props {
  sandboxes: SandboxInfo[];
  error: string | null;
}

export function Header({ sandboxes, error }: Props) {
  const running = sandboxes.filter((s) => s.status === 'running').length;
  const total = sandboxes.length;

  return (
    <div className={styles.header}>
      <span className={styles.title}>Northflank Sandbox Fleet</span>
      <div className={styles.stats}>
        {error && <span style={{ color: 'var(--accent-red)' }}>LINK DOWN</span>}
        <span>
          ACTIVE<span className={styles.statValue}>{running}</span>
        </span>
        <span>
          TOTAL<span className={styles.statValue}>{total}</span>
        </span>
      </div>
    </div>
  );
}
