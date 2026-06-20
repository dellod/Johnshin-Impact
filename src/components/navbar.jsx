// React libraries
import React, { useState } from "react";
import { Link } from "react-router-dom";

// CSS
import '../styles/navbar.css';

// Assets
import MenuIcon from '../assets/navbar/menu.png';

// Scripts
import { auth } from "../scripts/firebase";

const Navbar = ({ user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleToggleMenu = () => {
        setIsMenuOpen((currentState) => !currentState);
    };

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        auth.signOut();
        handleCloseMenu();
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
                    {!user ? (
                        <>
                            <Link to="/signup" className="navbar-link" onClick={handleCloseMenu}>Sign Up</Link>
                            <Link to="/login" className="navbar-link" onClick={handleCloseMenu}>Login</Link>
                        </>
                    ) : (
                        <button 
                            className="navbar-link" 
                            onClick={handleLogout}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                        >
                            Logout
                        </button>
                    )}
                </div>
             </div>
        </nav>
    )
}

export default Navbar;