import { PHONETIC_ALPHABET } from "../drills/drill-types.ts";

const LETTER_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIGIT_KEYS = "0123456789".split("");

export function PhoneticCheatsheet() {
  return (
    <details className="cheatsheet">
      <summary className="cheatsheet-summary">Phonetic alphabet reference</summary>
      <div className="cheatsheet-body">
        <div className="cheatsheet-grid">
          {LETTER_KEYS.map((k) => (
            <div key={k} className="cheatsheet-row">
              <span className="cheatsheet-key">{k}</span>
              <span className="cheatsheet-val">{PHONETIC_ALPHABET[k]}</span>
            </div>
          ))}
        </div>
        <div className="cheatsheet-grid cheatsheet-grid-digits">
          {DIGIT_KEYS.map((k) => (
            <div key={k} className="cheatsheet-row">
              <span className="cheatsheet-key">{k}</span>
              <span className="cheatsheet-val">{PHONETIC_ALPHABET[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
