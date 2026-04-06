import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';
import logoImg from '../assets/logo.svg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <Link to="/" className="navbar-logo">
          <img src={logoImg} alt="Service Logo" className="logo-icon" />
        </Link>

        <nav className="navbar-menu">
          <NavLink to="/majormap" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>전공설계</NavLink>
          <NavLink to="/timetable" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>시간표</NavLink>
          <NavLink to="/kommunity" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>커뮤니티</NavLink>
          <NavLink to="/study" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>스터디</NavLink>
        </nav>

        <Link to="/login" className="login-btn">
          로그인
        </Link>
      </div>

      <div 
        className={`slide-menu-overlay ${isMenuOpen ? 'open' : ''}`} 
        onClick={toggleMenu}
      ></div>

      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={toggleMenu}>✕</button>
        <nav className="slide-menu-nav">
          <NavLink to="/majormap" className="slide-item" onClick={toggleMenu}>전공설계</NavLink>
          <NavLink to="/timetable" className="slide-item" onClick={toggleMenu}>시간표</NavLink>
          <NavLink to="/kommunity" className="slide-item" onClick={toggleMenu}>커뮤니티</NavLink>
          <NavLink to="/study" className="slide-item" onClick={toggleMenu}>스터디</NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;