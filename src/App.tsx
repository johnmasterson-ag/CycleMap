import { useState } from 'react';
import type { TabId } from './components/TabBar';
import { CycleMap } from './components/CycleMap';
import { TrainsWeather } from './components/TrainsWeather';
import { CoffeeMap } from './components/CoffeeMap';
import { useBikePoints } from './hooks/useBikePoints';
import './App.css';

function App() {
  const { stations, error } = useBikePoints();
  const [activeTab, setActiveTab] = useState<TabId>('map');

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          Failed to load station data: {error}
        </div>
      )}

      {/* Floating app identity pill */}
      <div className="floating-identity">CycleMap</div>

      {/* Floating segmented tab control */}
      <div className="floating-tabs">
        <button
          className={`floating-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Bikes
        </button>
        <button
          className={`floating-tab ${activeTab === 'trains' ? 'active' : ''}`}
          onClick={() => setActiveTab('trains')}
        >
          Trains & Weather
        </button>
        <button
          className={`floating-tab ${activeTab === 'coffee' ? 'active' : ''}`}
          onClick={() => setActiveTab('coffee')}
        >
          Coffee
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'map' && <CycleMap stations={stations} />}
        {activeTab === 'trains' && <TrainsWeather />}
        {activeTab === 'coffee' && <CoffeeMap />}
      </div>
    </div>
  );
}

export default App;
