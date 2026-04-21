import { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { LanguagePicker } from './LanguagePicker';
import { OutputPanel } from './OutputPanel';
import { useExec } from '../hooks/useExec';
import { DEFAULT_CODE, type Language, type SandboxInfo } from '../types';
import styles from '../styles/components/CodePlayground.module.css';

interface Props {
  sandboxes: SandboxInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MONACO_LANG_MAP: Record<Language, string> = {
  python: 'python',
  node: 'javascript',
  go: 'go',
  bash: 'shell',
};

export function CodePlayground({ sandboxes, selectedId, onSelect }: Props) {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const { exec, loading, result, error } = useExec();

  const running = sandboxes.filter((s) => s.status === 'running');

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      setCode(DEFAULT_CODE[lang]);
    },
    [],
  );

  const handleRun = useCallback(async () => {
    if (!selectedId || !code.trim()) return;
    await exec(selectedId, code, language);
  }, [exec, selectedId, code, language]);

  return (
    <div className={styles.playground}>
      <div className={styles.toolbar}>
        <LanguagePicker value={language} onChange={handleLanguageChange} />

        <span className={styles.targetLabel}>Target</span>
        <select
          className={styles.select}
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="" disabled>
            Select sandbox
          </option>
          {running.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          className={styles.runBtn}
          onClick={handleRun}
          disabled={loading || !selectedId || !code.trim()}
        >
          {loading ? '...' : 'Run'}
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

      <OutputPanel result={result} loading={loading} error={error} />
    </div>
  );
}
