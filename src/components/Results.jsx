import Icon from './Icon.jsx';

function RouteCard({ route }) {
  return (
    <article className="result-card">
      <div className="result-top">
        <Icon name="truck" size={20} />
        <span>DEMO ROUTE</span>
      </div>
      <h3>
        {route.from} <span>→</span> {route.to}
      </h3>
      <p>{route.carrier}</p>
      <dl>
        <div>
          <dt>Vehicle</dt>
          <dd>{route.vehicle}</dd>
        </div>
        <div>
          <dt>Available space</dt>
          <dd>{route.capacity.toLocaleString()} kg</dd>
        </div>
        <div>
          <dt>Schedule</dt>
          <dd>{route.schedule}</dd>
        </div>
        <div>
          <dt>Est. transit</dt>
          <dd>{route.duration}</dd>
        </div>
      </dl>
      <div className="result-price">
        <span>
          Starting at <strong>₱{route.price.toLocaleString()}</strong>
        </span>
        <span>per shipment</span>
      </div>
    </article>
  );
}

export default function Results({ results, resultsRef, onHide }) {
  if (results === null) return null;

  return (
    <div
      className="results"
      ref={resultsRef}
      tabIndex={-1}
      aria-labelledby="results-title"
    >
      <div className="results-heading">
        <div>
          <h2 id="results-title">
            {results.length} matching{' '}
            {results.length === 1 ? 'route' : 'routes'}
          </h2>
          <p>
            Sample listings only. Prices are illustrative starting rates, not
            live quotes.
          </p>
        </div>
        <button className="text-link" onClick={onHide}>
          Hide results <Icon name="close" size={16} />
        </button>
      </div>

      {results.length ? (
        <div className="result-grid">
          {results.map((route) => (
            <RouteCard route={route} key={route.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="search" size={24} />
          <h3>No shared routes found just yet.</h3>
          <p>
            Try another destination or a smaller cargo weight. These sample
            listings cover a limited set of routes.
          </p>
        </div>
      )}
    </div>
  );
}
