export default function Header({ scenarios, scenarioId, onScenarioChange, onRun, status, onOpenReport, hasResult }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px', borderBottom: '1px solid var(--line)',
      background: 'var(--bg-panel)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 7, background: 'var(--teal-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--teal)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" stroke="#34d1c4" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M3 12c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" stroke="#34d1c4" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
            <circle cx="12" cy="6" r="2.4" stroke="#e8613d" strokeWidth="1.6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: 0.2 }}>Oil Spill Detection &amp; Ship Tracing</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>SIH26143 &middot; Disaster Management &middot; Code Crafters</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select
          value={scenarioId || ''}
          onChange={(e) => onScenarioChange(e.target.value)}
          style={{
            background: 'var(--bg-panel-raised)', color: 'var(--text-primary)',
            border: '1px solid var(--line-bright)', borderRadius: 6,
            padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
          }}
        >
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <button
          onClick={onRun}
          disabled={status === 'running'}
          style={{
            background: status === 'running' ? 'var(--bg-panel-raised)' : 'var(--teal)',
            color: status === 'running' ? 'var(--text-faint)' : '#0a0e15',
            border: 'none', borderRadius: 6, padding: '9px 16px',
            fontSize: 13, fontWeight: 600,
          }}
        >
          {status === 'running' ? 'Running pipeline\u2026' : 'Run pipeline'}
        </button>

        <button
          onClick={onOpenReport}
          disabled={!hasResult}
          style={{
            background: 'transparent', color: hasResult ? 'var(--text-primary)' : 'var(--text-faint)',
            border: '1px solid var(--line-bright)', borderRadius: 6, padding: '9px 14px',
            fontSize: 13, fontWeight: 500,
          }}
        >
          Evidence report
        </button>
      </div>
    </header>
  );
}
