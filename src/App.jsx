import { useRef, useState } from 'react';
import { cities, findRoutes } from './search.js';

function Icon({ name, size = 24, ...props }) {
  const paths = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5" /></>,
    truck: <><path d="M3 5h12v12H3zM15 9h4l3 4v4h-7" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    leaf: <><path d="M20 3C8 2 2 8 5 15s15 5 15-12ZM4 21 15 10" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    swap: <><path d="M4 7h16l-4-4M20 17H4l4 4" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    people: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 4 5v3" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.box}</svg>;
}

function Logo({ light = false }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="#home" aria-label="CargoFlow home"><svg viewBox="0 0 56 56" aria-hidden="true"><path d="M5 38V22c0-5 3-8 7-10L33 3v13l-15 6v21Z" fill="currentColor" /><path d="m37 3 14 5v14l-14-5ZM23 28l15-6-3-5 16 5-7 15-1-6-20 9Z" fill="#ff7a00" /><path d="m23 44 17-7v12l-17 6Z" fill="currentColor" /></svg><span>Cargo<span className="orange">Flow</span></span></a>;
}

const steps = [
  { icon: 'search', title: 'Find your match', text: 'Tell us where your cargo is going. Discover carriers headed the same way.' },
  { icon: 'box', title: 'Share the space', text: 'Choose the space you need, not an entire truck. Make room for smarter shipping.' },
  { icon: 'truck', title: 'Move together', text: 'Coordinate with your carrier and get your goods moving toward their next destination.' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weight, setWeight] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  function search(event) {
    event.preventDefault();
    if (from && from === to) {
      setError('Choose a destination different from your pickup location.');
      return;
    }
    setError('');
    setResults(findRoutes({ from, to, weight }));
    requestAnimationFrame(() => resultsRef.current?.focus({ preventScroll: false }));
  }

  function chooseRoute(start, end) {
    setFrom(start);
    setTo(end);
    setWeight('');
    setError('');
    setResults(findRoutes({ from: start, to: end }));
    requestAnimationFrame(() => resultsRef.current?.focus());
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="navigation"><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        <nav id="navigation" className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation" onClick={() => setMenuOpen(false)}>
          <a className="active" href="#home" aria-current="page">Home</a>
          <a href="#quick-search">Find cargo space</a>
          <a href="#how-it-works">How it works</a>
          <a href="#why-cargoflow">Why CargoFlow</a>
          <a className="button button-small" href="#quick-search">Let’s get moving <Icon name="arrow" size={17} /></a>
        </nav>
      </div>
    </header>

    <main id="main">
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> SHARED ROUTES. BRIGHTER FUTURES.</div>
            <h1>Same routes.<br />Greater <span>opportunities.</span></h1>
            <p className="hero-description">Big possibilities don’t need a full truck. Find, book, and share cargo space with people going your way.</p>
            <div className="hero-actions"><a className="button" href="#quick-search">Find cargo space <Icon name="arrow" size={20} /></a><a className="text-link" href="#how-it-works">See how it works <span className="play-icon">▶</span></a></div>
            <div className="hero-note"><span className="note-icon"><Icon name="shield" size={19} /></span> Built for local businesses. Made for the Philippines.</div>
          </div>
          <div className="hero-visual">
            <img src="/cargo-journey.svg" alt="A CargoFlow truck traveling along a winding road through tropical Philippine mountains at sunset" width="900" height="720" fetchPriority="high" />
            <div className="visual-topline"><span>PEOPLE. CARGO. POSSIBILITY.</span><span className="tiny-sun">✳</span></div>
            <div className="journey-badge"><span className="journey-icon"><Icon name="truck" /></span><div><strong>A little space. A lot of possibility.</strong><span>Connecting businesses, one route at a time.</span></div></div>
            <div className="visual-caption">SHARE SPACE. MOVE MORE.</div>
          </div>
        </div>
      </section>

      <section className="search-section container" id="quick-search" aria-labelledby="search-title">
        <div className="search-panel">
          <div className="search-heading"><div><span className="section-kicker">YOUR NEXT DELIVERY STARTS HERE</span><h2 id="search-title">Where are we headed?</h2></div><span className="search-hint"><Icon name="box" size={17} /> Small loads. More possibilities.</span></div>
          <form onSubmit={search}>
            <div className="search-fields">
              <label className="field"><span>Pickup location</span><div><Icon name="pin" size={20} /><select value={from} onChange={event => setFrom(event.target.value)} aria-label="Pickup location"><option value="">Any origin</option>{cities.map(city => <option key={city}>{city}</option>)}</select></div></label>
              <button className="swap-button" type="button" aria-label="Swap pickup and destination" onClick={() => { setFrom(to); setTo(from); }}><Icon name="swap" size={19} /></button>
              <label className="field"><span>Drop-off location</span><div><Icon name="pin" size={20} /><select value={to} onChange={event => setTo(event.target.value)} aria-label="Drop-off location"><option value="">Any destination</option>{cities.map(city => <option key={city}>{city}</option>)}</select></div></label>
              <label className="field weight-field"><span>Cargo weight</span><div><Icon name="box" size={20} /><input type="number" min="1" max="50000" step="1" placeholder="Optional" value={weight} onChange={event => setWeight(event.target.value)} /><span className="unit">kg</span></div></label>
              <button type="submit" className="button search-button"><Icon name="search" size={20} /> Find matches</button>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
          </form>
          <div className="popular"><span>Popular routes</span><button onClick={() => chooseRoute('Manila', 'Batangas')}>Manila <span>→</span> Batangas</button><button onClick={() => chooseRoute('Manila', 'Baguio')}>Manila <span>→</span> Baguio</button><button onClick={() => chooseRoute('Cebu', 'Davao')}>Cebu <span>→</span> Davao</button><span className="demo-label">Explore with demo data</span></div>
        </div>
        {results !== null && <div className="results" ref={resultsRef} tabIndex={-1} aria-labelledby="results-title">
          <div className="results-heading"><div><h2 id="results-title">{results.length} matching {results.length === 1 ? 'route' : 'routes'}</h2><p>Sample listings only. Prices are illustrative starting rates, not live quotes.</p></div><button className="text-link" onClick={() => { setResults(null); document.getElementById('search-title')?.scrollIntoView({ block: 'center' }); }}>Hide results <Icon name="close" size={16} /></button></div>
          {results.length ? <div className="result-grid">{results.map(route => <article className="result-card" key={route.id}><div className="result-top"><Icon name="truck" /><span>DEMO ROUTE</span></div><h3>{route.from} <span>→</span> {route.to}</h3><p>{route.carrier}</p><dl><div><dt>Vehicle</dt><dd>{route.vehicle}</dd></div><div><dt>Available space</dt><dd>{route.capacity.toLocaleString()} kg</dd></div><div><dt>Schedule</dt><dd>{route.schedule}</dd></div><div><dt>Est. transit</dt><dd>{route.duration}</dd></div></dl><div className="result-price"><span>Starting at <strong>₱{route.price.toLocaleString()}</strong></span><span>per shipment</span></div></article>)}</div> : <div className="empty-state"><Icon name="search" size={32} /><h3>No shared routes found just yet.</h3><p>Try another destination or a smaller cargo weight. These sample listings cover a limited set of routes.</p></div>}
        </div>}
      </section>

      <section className="benefit-strip container" aria-label="CargoFlow benefits"><div><Icon name="box" /><span>Pay for the space <strong>you actually need</strong></span></div><div><Icon name="leaf" /><span>Fewer empty trucks. <strong>Lighter footprints.</strong></span></div><div><Icon name="people" /><span>Local connections. <strong>Stronger communities.</strong></span></div></section>

      <section className="how-section container" id="how-it-works">
        <div className="section-heading"><span className="section-kicker">LESS HASSLE. MORE MOVEMENT.</span><h2>Your cargo. A shared journey.</h2><p>From a few boxes to your next big order, let’s make room for you.</p></div>
        <div className="steps">{steps.map((step, index) => <article className="step" key={step.title}><div className="step-top"><span className="step-icon"><Icon name={step.icon} size={30} /></span><span className="step-number">0{index + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </section>

      <section className="why-section" id="why-cargoflow"><div className="container why-grid"><div className="shared-visual" aria-hidden="true"><span className="section-kicker">A BETTER WAY FORWARD</span><div className="box-composition"><div className="parcel parcel-back"><Icon name="box" size={45} /><span>YOUR NEXT<br />BIG ORDER.</span></div><div className="parcel parcel-front"><svg viewBox="0 0 56 56"><path d="M5 38V22c0-5 3-8 7-10L33 3v13l-15 6v21Z" fill="#173d70" /><path d="m37 3 14 5v14l-14-5M23 28l24-10v15L23 43Z" fill="#ff7a00" /></svg><strong>Cargo<span>Flow</span></strong><small>SHARE SPACE. MOVE MORE.</small><div className="parcel-line" /></div><div className="parcel-sticker"><Icon name="leaf" size={20} /> Better together.</div></div><p>Small shipments.<br /><strong>Big possibilities.</strong></p></div><div className="why-copy"><span className="section-kicker">WHY CARGOFLOW?</span><h2>Good for your business.<br /><span>Better for the road.</span></h2><p>There’s opportunity in every empty space. We bring shippers and local carriers together to make deliveries more practical, more connected, and less wasteful.</p><ul><li><span><Icon name="check" size={17} /></span><div><strong>Share the ride, not the full cost</strong><p>Move your goods without paying for a whole truck.</p></div></li><li><span><Icon name="check" size={17} /></span><div><strong>Turn empty space into opportunity</strong><p>Help local carriers make the most of every trip.</p></div></li><li><span><Icon name="check" size={17} /></span><div><strong>Keep local businesses moving</strong><p>Built with Filipino sellers, SMEs, and communities in mind.</p></div></li></ul><a className="text-link" href="#quick-search">Find your next shared route <Icon name="arrow" size={20} /></a></div></div></section>

      <section className="container cta-section"><div className="cta"><div><span className="section-kicker">SAME DIRECTION. SHARED AMBITION.</span><h2>Let’s move more.<br /><span>Together.</span></h2><p>Your next opportunity might be going your way.</p></div><a href="#quick-search" className="button">Find your match <Icon name="arrow" size={21} /></a><div className="cta-road" aria-hidden="true" /></div></section>
    </main>

    <footer className="footer"><div className="container footer-main"><div><Logo /><p>Connecting people. Cargo. Possibilities.</p></div><nav aria-label="Footer navigation"><a href="#quick-search">Find cargo space</a><a href="#how-it-works">How it works</a><a href="#why-cargoflow">About CargoFlow</a></nav><div className="footer-tagline">SHARE SPACE.<br />MOVE MORE.<span>Made for the Philippines.</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} CargoFlow. A student-built frontend prototype.</span><span>Shared routes. Brighter futures.</span></div></footer>
  </>;
}
