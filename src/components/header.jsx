// React libraries
import React from "react"

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
        </header>
    );
}

export default Header;