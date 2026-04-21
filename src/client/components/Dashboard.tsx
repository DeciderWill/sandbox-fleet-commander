import { SandboxCard } from './SandboxCard';
import { SandboxControls } from './SandboxControls';
import type { SandboxInfo } from '../types';
import styles from '../styles/components/Dashboard.module.css';

interface Props {
  sandboxes: SandboxInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export function Dashboard({ sandboxes, selectedId, onSelect, onRefresh }: Props) {
  return (
    <div className={styles.dashboard}>
      <SandboxControls sandboxes={sandboxes} onRefresh={onRefresh} />
      {sandboxes.length === 0 ? (
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
