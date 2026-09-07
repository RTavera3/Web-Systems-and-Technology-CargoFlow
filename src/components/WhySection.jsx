import Icon from './Icon.jsx';

const reasons = [
  {
    title: 'Share the ride, not the full cost',
    text: 'Move your goods without paying for a whole truck.',
  },
  {
    title: 'Turn empty space into opportunity',
    text: 'Help local carriers make the most of every trip.',
  },
  {
    title: 'Keep local businesses moving',
    text: 'Built with Filipino sellers, SMEs, and communities in mind.',
  },
];

export default function WhySection() {
  return (
    <section className="why-section" id="why-cargoflow">
      <div className="container why-grid">
        <div className="shared-visual" aria-hidden="true">
          <span className="section-kicker">A BETTER WAY FORWARD</span>
          <div className="box-composition">
            <div className="parcel parcel-back">
              <Icon name="box" size={40} strokeWidth={1.5} />
              <span>
                YOUR NEXT
                <br />
                BIG ORDER.
              </span>
            </div>
            <div className="parcel parcel-front">
              <svg viewBox="0 0 56 56">
                <path
                  d="M5 38V22c0-5 3-8 7-10L33 3v13l-15 6v21Z"
                  fill="#173d70"
                />
                <path
                  d="m37 3 14 5v14l-14-5M23 28l24-10v15L23 43Z"
                  fill="#ff7a00"
                />
              </svg>
              <strong>
                Cargo<span>Flow</span>
              </strong>
              <small>SHARE SPACE. MOVE MORE.</small>
              <div className="parcel-line" />
            </div>
            <div className="parcel-sticker">
              <Icon name="leaf" size={20} /> Better together.
            </div>
          </div>
          <p>
            Small shipments.
            <br />
            <strong>Big possibilities.</strong>
          </p>
        </div>

        <div className="why-copy">
          <span className="section-kicker">WHY CARGOFLOW?</span>
          <h2>
            Good for your business.
            <br />
            <span>Better for the road.</span>
          </h2>
          <p>
            There’s opportunity in every empty space. We bring shippers and
            local carriers together to make deliveries more practical, more
            connected, and less wasteful.
          </p>
          <ul>
            {reasons.map((reason) => (
              <li key={reason.title}>
                <span>
                  <Icon name="check" size={16} />
                </span>
                <div>
                  <strong>{reason.title}</strong>
                  <p>{reason.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <a className="text-link" href="#quick-search">
            Find your next shared route <Icon name="arrow" size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
