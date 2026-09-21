import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export const Navbar = forwardRef<HTMLElement>((_, ref) => {
  return (
    <nav className="navbar" ref={ref}>
      <div className="brand-logo">
        TIEMPO<span>OSCURO</span>
      </div>
      <ul className="nav-menu">
        <li><a href="#works">MUNDOS</a></li>
        <li><a href="#about">NOSOTROS</a></li>
        <li><Link to="/libros" className="active">LIBROS</Link></li>
      </ul>
      <div className="lang-switch">
        <Link to="/login" className="active">
          INICIAR SESIÓN
        </Link>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';