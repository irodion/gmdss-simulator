import { CHANNELS } from "../drills/channels.ts";

export function ChannelCheatsheet() {
  return (
    <details className="cheatsheet">
      <summary className="cheatsheet-summary">VHF channel usage</summary>
      <div className="cheatsheet-body">
        <div className="cheatsheet-grid cheatsheet-grid-channels">
          {CHANNELS.map((entry) => (
            <div key={entry.channel} className="cheatsheet-row">
              <span className="cheatsheet-key">Ch {entry.channel}</span>
              <span className="cheatsheet-val">{entry.usage}</span>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
