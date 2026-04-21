import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { LanguagePicker } from './LanguagePicker';
import { broadcastExec } from '../api';
import { DEFAULT_CODE, type Language, type ExecResult } from '../types';
import styles from '../styles/components/BroadcastPanel.module.css';

const MONACO_LANG_MAP: Record<Language, string> = {
  python: 'python',
  node: 'javascript',
  go: 'go',
  bash: 'shell',
};

export function BroadcastPanel() {
  const [language, setLanguage] = useState<Language>('bash');
  const [code, setCode] = useState(DEFAULT_CODE.bash);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, ExecResult> | null>(null);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
  }, []);

  const handleBroadcast = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await broadcastExec(code, language);
      setResults(res);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [code, language]);

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <LanguagePicker value={language} onChange={handleLanguageChange} />
        <button
          className={styles.broadcastBtn}
          onClick={handleBroadcast}
          disabled={loading || !code.trim()}
        >
          {loading ? '...' : 'Broadcast'}
        </button>
      </div>

      <div className={styles.editorWrap}>
        <Editor
          height="100%"
          language={MONACO_LANG_MAP[language]}
          value={code}
          onChange={(v) => setCode(v || '')}
          theme="vs-dark"
          options={{
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'none',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            padding: { top: 8 },
          }}
        />
      </div>

      {results ? (
        <div className={styles.results}>
          {Object.entries(results).map(([id, res]) => (
            <div key={id} className={styles.resultRow}>
              <span className={styles.resultName}>{id}</span>
              <span className={styles.resultOutput}>
                {res.stdout || res.stderr || '(no output)'}
              </span>
              <span
                className={`${styles.resultExit} ${res.exitCode === 0 ? styles.success : styles.failure}`}
              >
                {res.exitCode}
              </span>
            </div>
          ))}
          {Object.keys(results).length === 0 && (
            <div className={styles.emptyResults}>No running sandboxes to broadcast to</div>
          )}
        </div>
      ) : (
        <div className={styles.emptyResults}>
          {loading ? 'Broadcasting...' : 'Broadcast a command to all running sandboxes'}
        </div>
      )}
    </div>
  );
}
