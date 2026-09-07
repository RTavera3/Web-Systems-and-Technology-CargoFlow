import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

export default function Header({ menuOpen, onToggleMenu, onCloseMenu }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <button
          className="menu-toggle"
          onClick={onToggleMenu}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="navigation"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
        </button>
        <nav
          id="navigation"
          className={menuOpen ? 'nav open' : 'nav'}
          aria-label="Main navigation"
          onClick={onCloseMenu}
        >
          <a className="active" href="#home" aria-current="page">
            Home
          </a>
          <a href="#quick-search">Find cargo space</a>
          <a href="#how-it-works">How it works</a>
          <a href="#why-cargoflow">Why CargoFlow</a>
          <a className="button button-small" href="#quick-search">
            Let’s get moving <Icon name="arrow" size={18} />
          </a>
        </nav>
      </div>
    </header>
  );
}
