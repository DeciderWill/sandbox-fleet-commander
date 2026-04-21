import { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CodePlayground } from './components/CodePlayground';
import { BroadcastPanel } from './components/BroadcastPanel';
import { useSandboxes } from './hooks/useSandboxes';

type RightTab = 'playground' | 'broadcast';

export function App() {
  const { sandboxes, error, refetch } = useSandboxes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('playground');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header sandboxes={sandboxes} error={error} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Dashboard
          sandboxes={sandboxes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRefresh={refetch}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <button
              onClick={() => setRightTab('playground')}
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '6px 16px',
                cursor: 'pointer',
                color: rightTab === 'playground' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRight: '1px solid var(--border)',
                background: rightTab === 'playground' ? 'var(--bg-card)' : 'transparent',
                borderBottom:
                  rightTab === 'playground' ? '1px solid var(--accent-blue)' : '1px solid transparent',
                marginBottom: '-1px',
              }}
            >
              Playground
            </button>
            <button
              onClick={() => setRightTab('broadcast')}
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '6px 16px',
                cursor: 'pointer',
                color: rightTab === 'broadcast' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRight: '1px solid var(--border)',
                background: rightTab === 'broadcast' ? 'var(--bg-card)' : 'transparent',
                borderBottom:
                  rightTab === 'broadcast' ? '1px solid var(--accent-amber)' : '1px solid transparent',
                marginBottom: '-1px',
              }}
            >
              Broadcast
            </button>
          </div>
          {rightTab === 'playground' ? (
            <CodePlayground
              sandboxes={sandboxes}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <BroadcastPanel />
          )}
        </div>
      </div>
    </div>
  );
}
