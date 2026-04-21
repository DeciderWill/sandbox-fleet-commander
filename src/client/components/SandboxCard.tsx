import { useState } from 'react';
import { StatusIndicator } from './StatusIndicator';
import { destroySandbox, pauseSandbox, resumeSandbox } from '../api';
import type { SandboxInfo } from '../types';
import styles from '../styles/components/SandboxCard.module.css';

interface Props {
  sandbox: SandboxInfo;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
}

function formatUptime(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function SandboxCard({ sandbox, selected, onSelect, onRefresh }: Props) {
  const [busy, setBusy] = useState(false);

  const handlePauseResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    try {
      if (sandbox.status === 'paused') {
        await resumeSandbox(sandbox.id);
      } else {
        await pauseSandbox(sandbox.id);
      }
      onRefresh();
    } catch {
      // handled by polling
    } finally {
      setBusy(false);
    }
  };

  const handleDestroy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Destroy ${sandbox.name}?`)) return;
    setBusy(true);
    try {
      await destroySandbox(sandbox.id);
      onRefresh();
    } catch {
      // handled by polling
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(selected ? null : sandbox.id)}
    >
      <div className={styles.topRow}>
        <span className={styles.name}>{sandbox.name}</span>
        <div className={styles.statusRow}>
          <StatusIndicator status={sandbox.status} />
          <span className={styles.statusLabel}>{sandbox.status}</span>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div>
          <div className={styles.infoLabel}>Image</div>
          <div className={styles.infoValue}>{sandbox.image}</div>
        </div>
        <div>
          <div className={styles.infoLabel}>Plan</div>
          <div className={styles.infoValue}>{sandbox.plan}</div>
        </div>
        <div>
          <div className={styles.infoLabel}>Uptime</div>
          <div className={styles.infoValue}>{formatUptime(sandbox.createdAt)}</div>
        </div>
        <div>
          <div className={styles.infoLabel}>Instances</div>
          <div className={styles.infoValue}>{sandbox.instances}</div>
        </div>
      </div>

      {sandbox.lastCommand && (
        <div className={styles.lastCommand}>&gt; {sandbox.lastCommand}</div>
      )}
      {sandbox.lastOutput && (
        <div className={styles.lastOutput}>{sandbox.lastOutput}</div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={handlePauseResume}
          disabled={busy || sandbox.status === 'creating' || sandbox.status === 'destroying'}
        >
          {sandbox.status === 'paused' ? 'Resume' : 'Pause'}
        </button>
        <button
          className={`${styles.actionBtn} ${styles.danger}`}
          onClick={handleDestroy}
          disabled={busy || sandbox.status === 'destroying'}
        >
          Destroy
        </button>
      </div>
    </div>
  );
}
