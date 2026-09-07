import Icon from './Icon.jsx';

export default function CtaSection() {
  return (
    <section className="container cta-section">
      <div className="cta">
        <div>
          <span className="section-kicker">
            SAME DIRECTION. SHARED AMBITION.
          </span>
          <h2>
            Let’s move more.
            <br />
            <span>Together.</span>
          </h2>
          <p>Your next opportunity might be going your way.</p>
        </div>
        <a href="#quick-search" className="button">
          Find your match <Icon name="arrow" size={18} />
        </a>
        <div className="cta-road" aria-hidden="true" />
      </div>
    </section>
  );
}
