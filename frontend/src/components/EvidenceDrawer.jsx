export default function EvidenceDrawer({ report, onClose }) {
  if (!report) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(6,9,14,0.72)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 50,
    }} onClick={onClose}>
      <div
        style={{
          width: 440, maxWidth: '92vw', height: '100%', background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--line-bright)', padding: '22px 24px', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--amber)', fontWeight: 600, letterSpacing: 0.3 }}>EVIDENCE REPORT</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{report.case_id}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--line-bright)', borderRadius: 6,
            color: 'var(--text-secondary)', width: 28, height: 28, fontSize: 14,
          }}>&times;</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.6 }}>
          {report.scenario}
        </p>

        <Section title="Detection">
          <Row k="Satellite" v={report.detection.satellite} />
          <Row k="Detected at" v={report.detection.detected_at} />
          <Row k="Confidence" v={`${(report.detection.confidence * 100).toFixed(0)}%`} />
          <Row k="Look-alike risk" v={report.detection.lookalike_risk} />
          <Row k="Area" v={`${report.detection.area_km2} km\u00b2`} />
          <Row k="Length" v={`${report.detection.length_km} km`} />
        </Section>

        <Section title="Reverse drift">
          <Row k="Origin estimate" v={`${report.drift_origin_estimate.lat.toFixed(4)}, ${report.drift_origin_estimate.lon.toFixed(4)}`} />
          <Row k="Time window" v={`${report.origin_time_window[0]} \u2192 ${report.origin_time_window[1]}`} />
        </Section>

        {report.primary_suspect && (
          <Section title="Primary suspect">
            <Row k="Vessel" v={`${report.primary_suspect.name} (${report.primary_suspect.mmsi})`} />
            <Row k="Flag / type" v={`${report.primary_suspect.flag} \u2014 ${report.primary_suspect.type}`} />
            <Row k="Suspect score" v={report.primary_suspect.suspect_score} highlight />
            <Row k="Distance from origin" v={`${report.primary_suspect.distance_from_origin_km} km`} />
            <Row k="Time delta" v={`${report.primary_suspect.time_delta_min} min`} />
            <Row k="AIS gap detected" v={report.primary_suspect.ais_gap_detected ? 'Yes' : 'No'} />
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              {report.primary_suspect.notes}
            </p>
          </Section>
        )}

        <Section title="All ranked vessels">
          {report.all_ranked_vessels.map(v => (
            <Row key={v.mmsi} k={v.name} v={v.suspect_score} />
          ))}
        </Section>

        <p style={{
          fontSize: 11.5, color: 'var(--text-faint)', marginTop: 20, paddingTop: 14,
          borderTop: '1px solid var(--line)', lineHeight: 1.6,
        }}>
          {report.disclaimer}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: 0.3, marginBottom: 8 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ k, v, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
      <span className="mono" style={{ color: highlight ? 'var(--amber)' : 'var(--text-primary)', fontWeight: highlight ? 600 : 400, textAlign: 'right' }}>{v}</span>
    </div>
  );
}
