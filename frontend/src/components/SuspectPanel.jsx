function scoreColor(score) {
  if (score >= 55) return '#e8613d';
  if (score >= 30) return '#e8a23d';
  return '#5b7a94';
}

function scoreLabel(score) {
  if (score >= 55) return 'PRIMARY SUSPECT';
  if (score >= 30) return 'POSSIBLE MATCH';
  return 'LOW LIKELIHOOD';
}

export default function SuspectPanel({ result }) {
  if (!result) {
    return <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No ranking yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {result.vessels.map((v, i) => {
        const color = scoreColor(v.suspect_score);
        return (
          <div key={v.mmsi} style={{
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '12px 14px',
            background: i === 0 ? 'var(--bg-panel-raised)' : 'transparent',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</span>
              <span className="mono" style={{ fontSize: 20, fontWeight: 600, color }}>{v.suspect_score}</span>
            </div>
            <div style={{ fontSize: 11.5, letterSpacing: 0.3, color, marginTop: 2, fontWeight: 600 }}>
              {scoreLabel(v.suspect_score)}
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.6 }}>
              MMSI {v.mmsi} &middot; {v.flag} &middot; {v.type}<br />
              {v.distance_km} km &middot; {v.time_delta_min} min from estimated origin
              {v.gap_flag && <><br /><span style={{ color: 'var(--amber)' }}>AIS reporting gap detected</span></>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              {v.notes}
            </div>
          </div>
        );
      })}
    </div>
  );
}
