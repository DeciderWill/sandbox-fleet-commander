import { useState, useCallback } from 'react';
import { execCode } from '../api';
import type { ExecResult, Language } from '../types';

export function useExec() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exec = useCallback(async (sandboxId: string, code: string, language: Language) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await execCode(sandboxId, code, language);
      setResult(res);
      return res;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exec, loading, result, error };
}
