import { useState } from 'react';
import { AVAILABILITY_COLORS } from '../utils/markerUtils';

const LEGEND_ITEMS = [
  { color: AVAILABILITY_COLORS.high, label: '50%+ available' },
  { color: AVAILABILITY_COLORS.medium, label: 'Getting low' },
  { color: AVAILABILITY_COLORS.low, label: 'Nearly empty' },
  { color: AVAILABILITY_COLORS.empty, label: 'Empty' },
];

export function Legend() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="map-legend" onClick={() => setExpanded(e => !e)}>
      {expanded ? (
        <>
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="legend-row">
              <span
                className="legend-dot"
                style={{ backgroundColor: item.color }}
              />
              <span className="legend-label">{item.label}</span>
            </div>
          ))}
        </>
      ) : (
        <div className="legend-collapsed">i</div>
      )}
    </div>
  );
}
