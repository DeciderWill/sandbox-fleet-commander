import type { SandboxStatus } from '../types';
import styles from '../styles/components/StatusIndicator.module.css';

export function StatusIndicator({ status }: { status: SandboxStatus }) {
  return <span className={`${styles.indicator} ${styles[status]}`} />;
}
