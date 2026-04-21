import { SandboxCard } from './SandboxCard';
import { SandboxControls } from './SandboxControls';
import type { SandboxInfo } from '../types';
import styles from '../styles/components/Dashboard.module.css';

interface Props {
  sandboxes: SandboxInfo[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}

export function Dashboard({ sandboxes, loading, selectedId, onSelect, onRefresh }: Props) {
  const showSpinner = loading && sandboxes.length === 0;
  return (
    <div className={styles.dashboard}>
      <SandboxControls sandboxes={sandboxes} onRefresh={onRefresh} />
      {showSpinner ? (
        <div className={styles.empty}>
          <div className={styles.spinner} aria-label="Loading sandboxes" />
        </div>
      ) : sandboxes.length === 0 ? (
        <div className={styles.empty}>No sandboxes — create one to begin</div>
      ) : (
        <div className={styles.grid}>
          {sandboxes.map((s) => (
            <SandboxCard
              key={s.id}
              sandbox={s}
              selected={selectedId === s.id}
              onSelect={onSelect}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
