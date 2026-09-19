const STEPS = [
  { key: 'detect', label: 'Detect', caption: 'SAR + U-Net finds slicks' },
  { key: 'trace', label: 'Trace', caption: 'Reverse drift finds the origin' },
  { key: 'attribute', label: 'Attribute', caption: 'AIS match names candidate ships' },
  { key: 'score', label: 'Score', caption: 'Rank vessels 0\u2013100' },
];

export default function PipelineSteps({ status, result }) {
  // status: 'idle' | 'running' | 'done'
  const activeIndex = status === 'idle' ? -1 : status === 'running' ? -1 : STEPS.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEPS.map((step, i) => {
        const done = status === 'done';
        const running = status === 'running';
        let value = null;
        if (done && result) {
          if (step.key === 'detect') value = `${(result.slick.confidence * 100).toFixed(0)}% confidence`;
          if (step.key === 'trace') value = `${result.drift.origin_estimate.lat.toFixed(3)}, ${result.drift.origin_estimate.lon.toFixed(3)}`;
          if (step.key === 'attribute') value = `${result.vessels.length} candidate vessels`;
          if (step.key === 'score') value = `top score ${result.vessels[0]?.suspect_score ?? '\u2014'}`;
        }
        return (
          <div key={step.key} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                border: `1.5px solid ${done ? 'var(--teal)' : 'var(--line-bright)'}`,
                background: done ? 'var(--teal-dim)' : 'var(--bg-panel-raised)',
                color: done ? 'var(--teal)' : 'var(--text-faint)',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 1.5, flex: 1, minHeight: 28, background: done ? 'var(--teal-dim)' : 'var(--line)' }} />
              )}
            </div>
            <div style={{ paddingBottom: 24 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: done ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {step.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                {step.caption}
              </div>
              {value && (
                <div className="mono" style={{ fontSize: 12, color: 'var(--teal)', marginTop: 6 }}>
                  {value}
                </div>
              )}
              {running && (
                <div className="mono" style={{ fontSize: 12, color: 'var(--amber)', marginTop: 6 }}>
                  running&hellip;
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
