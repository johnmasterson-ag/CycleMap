interface HeaderProps {
  stationCount: number;
  loading: boolean;
}

export function Header({ stationCount, loading }: HeaderProps) {
  return (
    <header className="app-header">
      <h1>CycleMap</h1>
      <p>
        Santander Cycles — London Docking Stations
        {loading ? ' (Loading…)' : ` (${stationCount} stations)`}
      </p>
    </header>
  );
}
