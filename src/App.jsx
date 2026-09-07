import { useRef, useState } from 'react';
import { findRoutes } from './search.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import SearchPanel from './components/SearchPanel.jsx';
import Results from './components/Results.jsx';
import BenefitStrip from './components/BenefitStrip.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import WhySection from './components/WhySection.jsx';
import CtaSection from './components/CtaSection.jsx';
import Footer from './components/Footer.jsx';

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
    requestAnimationFrame(() =>
      resultsRef.current?.focus({ preventScroll: false })
    );
  }

  function chooseRoute(start, end) {
    setFrom(start);
    setTo(end);
    setWeight('');
    setError('');
    setResults(findRoutes({ from: start, to: end }));
    requestAnimationFrame(() => resultsRef.current?.focus());
  }

  function hideResults() {
    setResults(null);
    document.getElementById('search-title')?.scrollIntoView({ block: 'center' });
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Header
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <main id="main">
        <Hero />

        <section
          className="search-section container"
          id="quick-search"
          aria-labelledby="search-title"
        >
          <SearchPanel
            from={from}
            to={to}
            weight={weight}
            setFrom={setFrom}
            setTo={setTo}
            setWeight={setWeight}
            error={error}
            onSearch={search}
            onChooseRoute={chooseRoute}
          />
          <Results results={results} resultsRef={resultsRef} onHide={hideResults} />
        </section>

        <BenefitStrip />
        <HowItWorks />
        <WhySection />
        <CtaSection />
      </main>

      <Footer />
    </>
  );
}
