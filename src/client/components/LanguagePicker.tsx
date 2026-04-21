import { LANGUAGES, type Language } from '../types';
import styles from '../styles/components/LanguagePicker.module.css';

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguagePicker({ value, onChange }: Props) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value as Language)}
    >
      {LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
