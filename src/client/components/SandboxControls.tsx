import { useState } from 'react';
import { spawnSandboxes, destroySandbox } from '../api';
import { IMAGES, PLANS, type SandboxInfo } from '../types';
import styles from '../styles/components/SandboxControls.module.css';

interface Props {
  sandboxes: SandboxInfo[];
  onRefresh: () => void;
}

export function SandboxControls({ sandboxes, onRefresh }: Props) {
  const [image, setImage] = useState(IMAGES[0].value);
  const [customImage, setCustomImage] = useState('');
  const [plan, setPlan] = useState(PLANS[1].value);
  const [spawnCount, setSpawnCount] = useState(1);
  const [spawning, setSpawning] = useState(false);
  const [destroyingAll, setDestroyingAll] = useState(false);

  const effectiveImage = customImage.trim() || image;

  const handleSpawn = async () => {
    setSpawning(true);
    try {
      await spawnSandboxes(spawnCount, effectiveImage, plan);
      onRefresh();
    } catch {
      // polling picks up
    } finally {
      setSpawning(false);
    }
  };

  const handleDestroyAll = async () => {
    if (!confirm(`Destroy all ${sandboxes.length} sandboxes?`)) return;
    setDestroyingAll(true);
    try {
      await Promise.allSettled(sandboxes.map((s) => destroySandbox(s.id)));
      onRefresh();
    } catch {
      // polling picks up
    } finally {
      setDestroyingAll(false);
    }
  };

  return (
    <div className={styles.controls}>
      <select className={styles.select} value={image} onChange={(e) => setImage(e.target.value)}>
        {IMAGES.map((i) => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        className={styles.customImage}
        placeholder="or custom image..."
        value={customImage}
        onChange={(e) => setCustomImage(e.target.value)}
      />

      <select className={styles.select} value={plan} onChange={(e) => setPlan(e.target.value)}>
        {PLANS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <div className={styles.separator} />

      <input
        type="number"
        className={styles.spawnInput}
        min={1}
        max={10}
        value={spawnCount}
        onChange={(e) => setSpawnCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
      />
      <button className={styles.btn} onClick={handleSpawn} disabled={spawning}>
        {spawning ? '...' : 'Spawn'}
      </button>

      <div className={styles.separator} />

      <button
        className={`${styles.btn} ${styles.danger}`}
        onClick={handleDestroyAll}
        disabled={destroyingAll || sandboxes.length === 0}
      >
        {destroyingAll ? '...' : 'Destroy All'}
      </button>
    </div>
  );
}
