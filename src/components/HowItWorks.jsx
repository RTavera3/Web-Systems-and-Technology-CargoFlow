import Icon from './Icon.jsx';

const steps = [
  {
    icon: 'search',
    title: 'Find your match',
    text: 'Tell us where your cargo is going. Discover carriers headed the same way.',
  },
  {
    icon: 'box',
    title: 'Share the space',
    text: 'Choose the space you need, not an entire truck. Make room for smarter shipping.',
  },
  {
    icon: 'truck',
    title: 'Move together',
    text: 'Coordinate with your carrier and get your goods moving toward their next destination.',
  },
];

export default function HowItWorks() {
  return (
    <section className="how-section container" id="how-it-works">
      <div className="section-heading">
        <span className="section-kicker">LESS HASSLE. MORE MOVEMENT.</span>
        <h2>Your cargo. A shared journey.</h2>
        <p>From a few boxes to your next big order, let’s make room for you.</p>
      </div>
      <div className="steps">
        {steps.map((step, index) => (
          <article className="step" key={step.title}>
            <div className="step-top">
              <span className="step-icon">
                <Icon name={step.icon} size={24} />
              </span>
              <span className="step-number">0{index + 1}</span>
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
