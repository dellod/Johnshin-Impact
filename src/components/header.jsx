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
            return;
        }

        const fetchUserData = async () => {
            try {
                const docSnapshot = await db.collection("users").doc(user.uid).get();
                if (docSnapshot.exists) {
                    const data = docSnapshot.data();
                    setUsername(data.username || "");
                    setPhoto(data.photoUrl || data.photoURL || "");

                    const achievementMap = data.achievements && typeof data.achievements === 'object'
                        ? data.achievements
                        : {};
                    const achievementIds = Object.keys(achievementMap);

                    if (achievementIds.length === 0) {
                        setTotalPoints(0);
                        return;
                    }

                    const achievementSnapshots = await Promise.all(
                        achievementIds.map((achievementId) => db.collection("achievements").doc(achievementId).get())
                    );

                    const nextTotalPoints = achievementSnapshots.reduce((sum, achievementSnapshot) => {
                        if (!achievementSnapshot.exists) {
                            return sum;
                        }

                        const achievementData = achievementSnapshot.data() || {};
                        const parsedPoints = Number(achievementData.points ?? 0);
                        return sum + (Number.isNaN(parsedPoints) ? 0 : parsedPoints);
                    }, 0);

                    setTotalPoints(nextTotalPoints);
                } else {
                    setUsername("");
                    setPhoto("");
                    setTotalPoints(0);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setTotalPoints(0);
            }
        };

        fetchUserData();
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