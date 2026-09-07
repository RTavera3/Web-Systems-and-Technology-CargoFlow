import Icon from './Icon.jsx';

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> SHARED ROUTES. BRIGHTER FUTURES.
          </div>
          <h1>
            Same routes.
            <br />
            Greater <span>opportunities.</span>
          </h1>
          <p className="hero-description">
            Big possibilities don’t need a full truck. Find, book, and share cargo
            space with people going your way.
          </p>
          <div className="hero-actions">
            <a className="button" href="#quick-search">
              Find cargo space <Icon name="arrow" size={18} />
            </a>
            <a className="button button-secondary" href="#how-it-works">
              <Icon name="play" size={16} fill="currentColor" /> See how it works
            </a>
          </div>
          <div className="hero-note">
            <span className="note-icon">
              <Icon name="shield" size={20} />
            </span>{' '}
            Built for local businesses. Made for the Philippines.
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="/cargo-journey.svg"
            alt="A CargoFlow truck traveling along a winding road through tropical Philippine mountains at sunset"
            width="900"
            height="720"
            fetchPriority="high"
          />
          <div className="visual-topline">
            <span>PEOPLE. CARGO. POSSIBILITY.</span>
            <span className="tiny-sun">✳</span>
          </div>
          <div className="journey-badge">
            <span className="journey-icon">
              <Icon name="truck" size={20} />
            </span>
            <div>
              <strong>A little space. A lot of possibility.</strong>
              <span>Connecting businesses, one route at a time.</span>
            </div>
          </div>
          <div className="visual-caption">SHARE SPACE. MOVE MORE.</div>
        </div>
      </div>
    </section>
  );
}
