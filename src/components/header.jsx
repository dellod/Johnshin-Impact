// React libraries
import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom";

// CSS
import '../styles/header.css';

// Assets
import Logo from '../assets/john_logo.png'
import Primogem from '../assets/primogem.png';

// Scripts
import db from "../scripts/firebase";


const Header = ({ user }) =>
{
    const [userData, setUserData] = useState(null);
    const [username, setUsername] = useState("");
    const [photo, setPhoto] = useState("");

    const fetchUserData = async () => {
        try {
            const docSnapshot = await db.collection("users").doc(user.uid).get();
            if (docSnapshot.exists) {
                const data = docSnapshot.data();
                setUserData(data);
                setUsername(data.username);
                setPhoto(data.photoUrl);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    return (
        <header className="header-stage">
            <img className="john-logo" src={Logo} alt="John logo" />
            <h1 className="header-title">Johnshin Impact</h1>
            {!user && (
                <div className="header-actions">
                    <Link to="/signup" className="action-link action-link-primary">
                        Sign Up
                    </Link>
                    <Link to="/login" className="action-link action-link-secondary">
                        Login
                    </Link>
                </div>
            )}
            {user && (
                <>
                    <a href="/profile" className="user-info">
                        {photo && <img className="profile-photo" src={photo} alt={`${username}'s profile`} />}
                        <span className="welcome-message">{username}</span>
                    </a>
                    <div className="user-points">
                        <span className="points-label"><img src={Primogem} className="points-icon" alt="Points" /> {0}</span> {/* Placeholder for points, replace with actual points from userData when available */}
                    </div>
                </>

            )}
        </header>
    );
}

export default Header;