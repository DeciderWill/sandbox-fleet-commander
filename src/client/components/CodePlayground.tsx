import { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LanguagePicker } from './LanguagePicker';
import { OutputPanel } from './OutputPanel';
import { useExec } from '../hooks/useExec';
import { DEFAULT_CODE, type Language, type SandboxInfo } from '../types';
import styles from '../styles/components/CodePlayground.module.css';

interface Props {
  sandboxes: SandboxInfo[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const MONACO_LANG_MAP: Record<Language, string> = {
  python: 'python',
  node: 'javascript',
  bash: 'shell',
  command: 'shell',
};

function imageToLanguage(image: string): Language {
  const name = image.toLowerCase().split('/').pop() || '';
  if (name.startsWith('python')) return 'python';
  if (name.startsWith('node')) return 'node';
  return 'bash';
}

export function CodePlayground({ sandboxes, selectedId, onSelect }: Props) {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const { exec, loading, result, error } = useExec();

  const running = sandboxes.filter((s) => s.status === 'running');

  // Compute effective target: selected if still running, else first running, else null
  const effectiveId =
    selectedId && running.some((s) => s.id === selectedId)
      ? selectedId
      : running.length > 0
        ? running[0].id
        : null;

  // Sync selection state when effectiveId diverges from selectedId
  useEffect(() => {
    if (effectiveId !== selectedId) {
      onSelect(effectiveId);
    }
  }, [effectiveId, selectedId, onSelect]);

  // Switch the editor language to match the selected sandbox's runtime.
  // Falls back to bash when the image isn't a recognised runtime.
  useEffect(() => {
    if (!effectiveId) return;
    const target = sandboxes.find((s) => s.id === effectiveId);
    if (!target) return;
    const next = imageToLanguage(target.image);
    setLanguage((prev) => {
      if (prev === next) return prev;
      setCode(DEFAULT_CODE[next]);
      return next;
    });
  }, [effectiveId, sandboxes]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
  }, []);

  const handleRun = useCallback(async () => {
    if (!effectiveId || !code.trim()) return;
    await exec(effectiveId, code, language);
  }, [exec, effectiveId, code, language]);

  return (
    <div className={styles.playground}>
      <div className={styles.toolbar}>
        <LanguagePicker value={language} onChange={handleLanguageChange} />

        <span className={styles.targetLabel}>Target</span>
        <select
          className={styles.select}
          value={effectiveId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
        >
          {running.length === 0 && (
            <option value="" disabled>
              No running sandboxes
            </option>
          )}
          {running.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          className={styles.runBtn}
          onClick={handleRun}
          disabled={loading || !effectiveId || !code.trim()}
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
