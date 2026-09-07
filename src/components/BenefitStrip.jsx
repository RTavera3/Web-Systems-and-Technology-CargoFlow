import Icon from './Icon.jsx';

export default function BenefitStrip() {
  return (
    <section className="benefit-strip container" aria-label="CargoFlow benefits">
      <div>
        <Icon name="box" size={24} />
        <span>
          Pay for the space <strong>you actually need</strong>
        </span>
      </div>
      <div>
        <Icon name="leaf" size={24} />
        <span>
          Fewer empty trucks. <strong>Lighter footprints.</strong>
        </span>
      </div>
      <div>
        <Icon name="people" size={24} />
        <span>
          Local connections. <strong>Stronger communities.</strong>
        </span>
      </div>
    </section>
  );
}
