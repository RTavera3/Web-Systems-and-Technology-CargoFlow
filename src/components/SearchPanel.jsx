import { cities } from '../search.js';
import Icon from './Icon.jsx';

export default function SearchPanel({
  from,
  to,
  weight,
  setFrom,
  setTo,
  setWeight,
  error,
  onSearch,
  onChooseRoute,
}) {
  return (
    <div className="search-panel">
      <div className="search-heading">
        <div>
          <span className="section-kicker">YOUR NEXT DELIVERY STARTS HERE</span>
          <h2 id="search-title">Where are we headed?</h2>
        </div>
        <span className="search-hint">
          <Icon name="box" size={16} /> Small loads. More possibilities.
        </span>
      </div>

      <form onSubmit={onSearch}>
        <div className="search-fields">
          <label className="field">
            <span>Pickup location</span>
            <div>
              <Icon name="pin" size={20} />
              <select
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                aria-label="Pickup location"
              >
                <option value="">Any origin</option>
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </div>
          </label>

          <button
            className="swap-button"
            type="button"
            aria-label="Swap pickup and destination"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            <Icon name="swap" size={20} />
          </button>

          <label className="field">
            <span>Drop-off location</span>
            <div>
              <Icon name="pin" size={20} />
              <select
                value={to}
                onChange={(event) => setTo(event.target.value)}
                aria-label="Drop-off location"
              >
                <option value="">Any destination</option>
                {cities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="field weight-field">
            <span>Cargo weight</span>
            <div>
              <Icon name="box" size={20} />
              <input
                type="number"
                min="1"
                max="50000"
                step="1"
                placeholder="Optional"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
              />
              <span className="unit">kg</span>
            </div>
          </label>

          <button type="submit" className="button search-button">
            <Icon name="search" size={18} /> Find matches
          </button>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <div className="popular">
        <span>Popular routes</span>
        <button onClick={() => onChooseRoute('Manila', 'Batangas')}>
          Manila <span>→</span> Batangas
        </button>
        <button onClick={() => onChooseRoute('Manila', 'Baguio')}>
          Manila <span>→</span> Baguio
        </button>
        <button onClick={() => onChooseRoute('Cebu', 'Davao')}>
          Cebu <span>→</span> Davao
        </button>
        <span className="demo-label">Explore with demo data</span>
      </div>
    </div>
  );
}
