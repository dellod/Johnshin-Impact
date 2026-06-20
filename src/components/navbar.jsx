// React libraries
import React, { useState } from "react";
import { Link } from "react-router-dom";

// CSS
import '../styles/navbar.css';

// Assets
import MenuIcon from '../assets/navbar/menu.png';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleToggleMenu = () => {
        setIsMenuOpen((currentState) => !currentState);
    };

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    };

    return(
        <nav className="navbar">
            <div className="">
                <button
                    type="button"
                    className="navbar-menu-button"
                    onClick={handleToggleMenu}
                    aria-expanded={isMenuOpen}
                    aria-controls="navbar-links"
                    aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                    <img src={MenuIcon} alt="" className="navbar-menu-icon" />
                </button>
                <div
                    id="navbar-links"
                    className={`navbar-links ${isMenuOpen ? 'navbar-links-open' : ''}`}
                >
                    <Link to="/" className="navbar-link" onClick={handleCloseMenu}>Home</Link>
                    <Link to="/signup" className="navbar-link" onClick={handleCloseMenu}>Sign Up</Link>
                    <Link to="/login" className="navbar-link" onClick={handleCloseMenu}>Login</Link>
                </div>
             </div>
        </nav>
    )
}

export default Navbar;