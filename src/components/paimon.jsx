import React, { useEffect, useState } from 'react';
import '../styles/paimon.css';
import PaimonImage from '../assets/paimon.png';

const TIPS = [
    "Check the leaderboard to see how you rank against other travelers.",
    "Visit user profiles to see their achievements and completed missions.",
    "Did you know, John's favourite character is Raiden Shogun",
    "Thirsty? Make sure to drink henny shots to earn achievements!",
    "Every point brings you closer to the top of the leaderboard.",
];

const Paimon = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentTip, setCurrentTip] = useState('');

    useEffect(() => {
        // Schedule next Paimon appearance
        const schedulePaimon = () => {
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            setCurrentTip(randomTip);
            setIsVisible(true);
        };

        // Initial delay before first appearance (2-5 seconds)
        const initialDelay = setTimeout(schedulePaimon, Math.random() * (5 * 1000 - 2 * 1000) + 2 * 1000);

        return () => clearTimeout(initialDelay);
    }, []);

    const handleClose = () => {
        setIsVisible(false);

        // Schedule next appearance after close (30 seconds to 2 minutes)
        const nextShowTime = Math.random() * (2 * 60 * 1000 - 30 * 1000) + 30 * 1000;
        setTimeout(() => {
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            setCurrentTip(randomTip);
            setIsVisible(true);
        }, nextShowTime);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="paimon-container">
            <div className="paimon-character">
                <img
                    src={PaimonImage}
                    alt="Paimon"
                    className="paimon-image"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            </div>
            <div className="paimon-tip-bubble">
                <p className="paimon-tip-text">{currentTip}</p>
                <button
                    className="paimon-close-btn"
                    onClick={handleClose}
                    aria-label="Close Paimon tip"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Paimon;
