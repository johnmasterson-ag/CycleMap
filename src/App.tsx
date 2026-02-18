import { Header } from './components/Header';
import { CycleMap } from './components/CycleMap';
import { useBikePoints } from './hooks/useBikePoints';
import './App.css';

function App() {
  const { stations, loading, error } = useBikePoints();

  return (
    <div className="app">
      <Header stationCount={stations.length} loading={loading} />
      {error && (
        <div className="error-banner">
          Failed to load station data: {error}
        </div>
      )}
      <CycleMap stations={stations} />
    </div>
  );
}

export default App;
