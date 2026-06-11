import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-flag">🇦🇷</span>
          <span className="brand-text">PRODE <span className="brand-highlight">MUNDIAL</span> 2026</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {user && (
            <>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Partidos
              </Link>
              <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Tabla
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link admin-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        {user && (
          <div className="navbar-user">
            <span className="user-name">Hola, {user.name.split(' ')[0]}</span>
            <button className="btn-logout" onClick={handleLogout}>Salir</button>
          </div>
        )}
      </div>
    </nav>
  );
}
