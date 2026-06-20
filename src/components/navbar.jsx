// React libraries
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// CSS
import '../styles/navbar.css';

// Assets
import MenuIcon from '../assets/navbar/menu.png';

// Scripts
import { auth } from "../scripts/firebase";

const Navbar = ({ user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navRef = useRef(null);

    const handleToggleMenu = () => {
        setIsMenuOpen((currentState) => !currentState);
    };

    const handleCloseMenu = () => {
        setIsMenuOpen(false);
    };

    useEffect(() => {
        if (!isMenuOpen) {
            return undefined;
        }

        const handlePointerDownOutside = (event) => {
            if (!navRef.current) {
                return;
            }

            if (!navRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDownOutside);
        document.addEventListener('touchstart', handlePointerDownOutside);

        return () => {
            document.removeEventListener('mousedown', handlePointerDownOutside);
            document.removeEventListener('touchstart', handlePointerDownOutside);
        };
    }, [isMenuOpen]);

    const handleLogout = () => {
        auth.signOut();
        handleCloseMenu();
    };

    return(
        <nav className="navbar" ref={navRef}>
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
                    <Link to="/achievements" className="navbar-link" onClick={handleCloseMenu}>Achievements</Link>
                    <Link to="/leaderboard" className="navbar-link" onClick={handleCloseMenu}>Leaderboard</Link>
                    {!user ? (
                        <>
                            <Link to="/signup" className="navbar-link" onClick={handleCloseMenu}>Sign Up</Link>
                            <Link to="/login" className="navbar-link" onClick={handleCloseMenu}>Login</Link>
                        </>
                    ) : (
                        <>
                            <Link to={`/profile/${user ? user.uid : ''}`} className="navbar-link" onClick={handleCloseMenu}>Profile</Link>
                            <button
                                className="navbar-link"
                                onClick={handleLogout}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
             </div>
        </nav>
    )
}

export default Navbar;