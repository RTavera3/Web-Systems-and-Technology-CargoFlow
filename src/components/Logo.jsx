export default function Logo({ light = false }) {
  return (
    <a
      className={`brand ${light ? 'brand-light' : ''}`}
      href="#home"
      aria-label="CargoFlow home"
    >
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M5 38V22c0-5 3-8 7-10L33 3v13l-15 6v21Z" fill="currentColor" />
        <path
          d="m37 3 14 5v14l-14-5ZM23 28l15-6-3-5 16 5-7 15-1-6-20 9Z"
          fill="#ff7a00"
        />
        <path d="m23 44 17-7v12l-17 6Z" fill="currentColor" />
      </svg>
      <span>
        Cargo<span className="orange">Flow</span>
      </span>
    </a>
  );
}
