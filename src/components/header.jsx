// React libraries
import React from "react"
import { Link } from "react-router-dom";

// CSS
import '../styles/header.css';

// Assets
import Logo from '../assets/john_logo.png'

const Header = () =>
{
    return (
        <header className="header-stage">
            <img className="john-logo" src={Logo} alt="John logo" />
            <h1 className="header-title">Johnshin Impact</h1>
            <div className="header-actions">
                <Link to="/signup" className="action-link action-link-primary">
                    Sign Up
                </Link>
                <Link to="/login" className="action-link action-link-secondary">
                    Login
                </Link>
            </div>
        </header>
    );
}

export default Header;