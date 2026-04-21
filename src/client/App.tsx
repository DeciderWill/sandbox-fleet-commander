import { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CodePlayground } from './components/CodePlayground';
import { useSandboxes } from './hooks/useSandboxes';

export function App() {
  const { sandboxes, loading, error, refetch } = useSandboxes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
          loading={loading}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRefresh={refetch}
        />
        <CodePlayground
          sandboxes={sandboxes}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
