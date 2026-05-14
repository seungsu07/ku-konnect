import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import './Navbar.css';
import logoImg from '../assets/logo.svg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
  const [loginId, setLoginId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('login_id');
    setLoginId(storedId);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('login_id');
    setLoginId(null);
    window.location.reload();
  };

  // Apply default light mode on mount and synchronize with state
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
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

        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          {loginId ? (
            <div className="user-actions">
              <span className="user-id">{loginId}</span>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              로그인
            </Link>
          )}
        </div>
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