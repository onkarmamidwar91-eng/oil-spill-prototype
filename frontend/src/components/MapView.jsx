import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect, Fragment } from 'react';
import 'leaflet/dist/leaflet.css';

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

function scoreColor(score) {
  if (score >= 55) return '#e8613d';
  if (score >= 30) return '#e8a23d';
  return '#5b7a94';
}

export default function MapView({ scenario, result }) {
  if (!scenario || !result) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-faint)', fontSize: 14,
      }}>
        Select a scenario and run the pipeline to render the map
      </div>
    );
  }

  const bbox = scenario.region.bbox;
  const bounds = [[bbox[0][0], bbox[0][1]], [bbox[1][0], bbox[1][1]]];
  const slickPositions = result.slick.polygon.map(([lat, lon]) => [lat, lon]);
  const driftPath = result.drift.best_estimate.map(p => [p.lat, p.lon]);
  const origin = result.drift.origin_estimate;

  return (
    <MapContainer center={[scenario.region.center.lat, scenario.region.center.lon]} zoom={9} style={{ height: '100%', width: '100%' }} zoomControl={true} attributionControl={true}>
      <FitBounds bounds={bounds} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />

      {/* Drift uncertainty ensemble */}
      {result.drift.ensemble.map((track, i) => (
        <Polyline
          key={`ens-${i}`}
          positions={track.map(p => [p.lat, p.lon])}
          pathOptions={{ color: '#34d1c4', weight: 1, opacity: 0.18 }}
        />
      ))}

      {/* Best-estimate reverse drift path */}
      <Polyline positions={driftPath} pathOptions={{ color: '#34d1c4', weight: 2.5, opacity: 0.9, dashArray: '2 6' }} />

      {/* Detected slick */}
      <Polygon positions={slickPositions} pathOptions={{ color: '#e8613d', weight: 1.5, fillColor: '#e8613d', fillOpacity: 0.35 }}>
        <Popup>
          <div className="mono" style={{ fontSize: 12 }}>
            <strong>Detected slick</strong><br />
            confidence: {(result.slick.confidence * 100).toFixed(0)}%<br />
            area: {result.slick.area_km2} km²<br />
            length: {result.slick.length_km} km
          </div>
        </Popup>
      </Polygon>

      {/* Origin estimate */}
      <CircleMarker center={[origin.lat, origin.lon]} radius={7} pathOptions={{ color: '#34d1c4', weight: 2, fillColor: '#0a0e15', fillOpacity: 1 }}>
        <Popup>
          <div className="mono" style={{ fontSize: 12 }}>
            <strong>Estimated origin</strong><br />
            {origin.lat.toFixed(4)}, {origin.lon.toFixed(4)}
          </div>
        </Popup>
      </CircleMarker>

      {/* Vessel tracks */}
      {result.vessels.map((v) => {
        const color = scoreColor(v.suspect_score);
        const positions = v.track.map(p => [p.lat, p.lon]);
        const last = positions[positions.length - 1];
        return (
          <Fragment key={v.mmsi}>
            <Polyline positions={positions} pathOptions={{ color, weight: 2, opacity: 0.85 }} />
            <CircleMarker center={last} radius={5} pathOptions={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.9 }}>
              <Popup>
                <div className="mono" style={{ fontSize: 12 }}>
                  <strong>{v.name}</strong><br />
                  MMSI {v.mmsi} &middot; {v.flag}<br />
                  {v.type}<br />
                  suspect score: {v.suspect_score}<br />
                  {v.distance_km} km / {v.time_delta_min} min from origin
                </div>
              </Popup>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
}
