import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div>
          <Logo />
          <p>Connecting people. Cargo. Possibilities.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#quick-search">Find cargo space</a>
          <a href="#how-it-works">How it works</a>
          <a href="#why-cargoflow">About CargoFlow</a>
        </nav>
        <div className="footer-tagline">
          SHARE SPACE.
          <br />
          MOVE MORE.
          <span>Made for the Philippines.</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} CargoFlow. A student-built frontend
          prototype.
        </span>
        <span>Shared routes. Brighter futures.</span>
      </div>
    </footer>
  );
}
