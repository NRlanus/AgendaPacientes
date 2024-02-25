import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import './Menu.css';

function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleMenuPosition = (e) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="menu-container" onMouseLeave={closeMenu}>
      <button className="menu-button" onClick={toggleMenu} onMouseEnter={handleMenuPosition}>
        Menu
      </button>
      {isOpen && (
        <ul className="menu-items" style={{ top: position.y, left: position.x }}>
          <li><Link to="/Admin">Administrador</Link></li> 
          <li><Link to="/Agenda">Agenda</Link></li>
          <li><Link to="/ListaPacientes">Lista Pacientes</Link></li>
        </ul>
      )}
    </div>
  );
}

export default Menu;

