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
    const [username, setUsername] = useState("");
    const [photo, setPhoto] = useState("");
    const [totalPoints, setTotalPoints] = useState(0);

    useEffect(() => {
        if (!user) {
            setUsername("");
            setPhoto("");
            setTotalPoints(0);
            return undefined;
        }

        setUsername(user.displayName || "");
        setPhoto(user.photoURL || "");

        const unsubscribe = db.collection("users").doc(user.uid).onSnapshot(
            (docSnapshot) => {
                if (!docSnapshot.exists) {
                    return;
                }

                const data = docSnapshot.data() || {};
                setUsername(data.username || user.displayName || "");
                setPhoto(data.photoUrl || data.photoURL || user.photoURL || "");

                const parsedPoints = Number(data.points ?? 0);
                setTotalPoints(Number.isNaN(parsedPoints) ? 0 : parsedPoints);
            },
            (error) => {
                console.error("Error subscribing to user data:", error);
            }
        );

        return () => unsubscribe();
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
                    <Link to={`/profile/${user.uid}`} className="user-info">
                        {photo && <img className="profile-photo" src={photo} alt={`${username}'s profile`} />}
                        <span className="welcome-message">{username}</span>
                    </Link>
                    <div className="user-points">
                        <span className="points-label"><img src={Primogem} className="points-icon" alt="Points" /> {totalPoints}</span>
                    </div>
                </>

            )}
        </header>
    );
}

export default Header;