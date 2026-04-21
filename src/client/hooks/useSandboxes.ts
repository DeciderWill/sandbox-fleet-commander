import { useState, useEffect, useCallback, useRef } from 'react';
import { listSandboxes } from '../api';
import type { SandboxInfo } from '../types';

const POLL_INTERVAL = 1500;

export function useSandboxes() {
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const data = await listSandboxes();
      if (mountedRef.current) {
        setSandboxes(data);
        setError(null);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e.message);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    const id = setInterval(fetch, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetch]);

  return { sandboxes, loading, error, refetch: fetch };
}
