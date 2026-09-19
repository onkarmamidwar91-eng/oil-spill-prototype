import { useEffect, useState } from 'react';
import Header from './components/Header';
import PipelineSteps from './components/PipelineSteps';
import MapView from './components/MapView';
import SuspectPanel from './components/SuspectPanel';
import EvidenceDrawer from './components/EvidenceDrawer';
import { listScenarios, runPipeline, getEvidenceReport } from './api';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    listScenarios()
      .then(list => {
        setScenarios(list);
        if (list.length) setScenarioId(list[0].id);
      })
      .catch(() => setError('Could not reach the API. Is the backend running on :8000?'));
  }, []);

  const scenario = scenarios.find(s => s.id === scenarioId);

  const handleRun = async () => {
    if (!scenarioId) return;
    setStatus('running');
    setError(null);
    setResult(null);
    try {
      const res = await runPipeline(scenarioId);
      setResult(res);
      setStatus('done');
    } catch (e) {
      setError('Pipeline run failed. Check that the backend is running.');
      setStatus('idle');
    }
  };

  const handleOpenReport = async () => {
    if (!scenarioId) return;
    try {
      const r = await getEvidenceReport(scenarioId);
      setReport(r);
    } catch (e) {
      setError('Could not generate the evidence report.');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        scenarios={scenarios}
        scenarioId={scenarioId}
        onScenarioChange={(id) => { setScenarioId(id); setResult(null); setStatus('idle'); }}
        onRun={handleRun}
        status={status}
        onOpenReport={handleOpenReport}
        hasResult={!!result}
      />

      {error && (
        <div style={{
          background: 'var(--red-dim)', color: '#f3b3a0', fontSize: 13,
          padding: '8px 24px', borderBottom: '1px solid var(--line)',
        }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 340px', minHeight: 0 }}>
        <aside style={{
          borderRight: '1px solid var(--line)', background: 'var(--bg-panel)',
          padding: '20px 20px', overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: 0.3, marginBottom: 16 }}>
            PIPELINE
          </div>
          <PipelineSteps status={status} result={result} />

          {scenario && (
            <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: 0.3, marginBottom: 10 }}>
                SCENE
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {scenario.satellite}<br />
                {scenario.detected_at}
              </div>
            </div>
          )}
        </aside>

        <main style={{ minWidth: 0, minHeight: 0, position: 'relative' }}>
          <MapView scenario={scenario} result={result} />
        </main>

        <aside style={{
          borderLeft: '1px solid var(--line)', background: 'var(--bg-panel)',
          padding: '20px 20px', overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: 0.3, marginBottom: 16 }}>
            SUSPECT RANKING
          </div>
          <SuspectPanel result={result} />
        </aside>
      </div>

      <EvidenceDrawer report={report} onClose={() => setReport(null)} />
    </div>
  );
}
