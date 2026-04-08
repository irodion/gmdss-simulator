interface ScoreGaugeProps {
  value: number;
}

export function ScoreGauge({ value }: ScoreGaugeProps) {
  // Map 0-100 to 0-180 degrees for the semicircular gauge
  const fillDeg = Math.round((value / 100) * 180);

  return (
    <div className="sim-score-card">
      <div
        className="sim-gauge"
        aria-hidden="true"
        style={{ "--gauge-fill": `${fillDeg}deg` } as React.CSSProperties}
      />
      <div className="sim-score-value">{value}%</div>
    </div>
  );
}
