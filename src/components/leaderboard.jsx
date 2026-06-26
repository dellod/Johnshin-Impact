// React libraries
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Styles
import '../styles/leaderboard.css';

// Assets
import PointsIcon from '../assets/primogem.png';

// Scripts
import db from "../scripts/firebase";

// Adventure rank helpers (mirrors profile.jsx)
const MAX_AR_LEVEL = 60;
const AR_LEVEL_CAP_POINTS = 1200;

function arThreshold(level) {
    if (level <= 1) return 0;
    return Math.round(AR_LEVEL_CAP_POINTS * Math.pow((level - 1) / (MAX_AR_LEVEL - 1), 1.5));
}

function getAdventureRank(points) {
    const capped = Math.min(points, AR_LEVEL_CAP_POINTS);
    for (let lvl = MAX_AR_LEVEL; lvl >= 1; lvl--) {
        if (capped >= arThreshold(lvl)) return lvl;
    }
    return 1;
}

function getAscensionPhase(level) {
    if (level >= 55) return 6;
    if (level >= 50) return 5;
    if (level >= 45) return 4;
    if (level >= 35) return 3;
    if (level >= 25) return 2;
    if (level >= 15) return 1;
    return 0;
}

const Leaderboard = ({ user }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError('');

                // Fetch all users
                const usersSnapshot = await db.collection('users').get();

                // Process users using denormalized points
                const users = [];
                usersSnapshot.forEach((doc) => {
                    const userData = doc.data() || {};
                    const parsedPoints = Number(userData.points ?? 0);
                    const totalPoints = Number.isNaN(parsedPoints) ? 0 : parsedPoints;

                    users.push({
                        id: doc.id,
                        username: userData.username || 'Unknown user',
                        photoUrl: userData.photoUrl || userData.photoURL || '',
                        points: totalPoints,
                    });
                });

                // Sort by points descending
                users.sort((a, b) => b.points - a.points);

                setLeaderboardData(users);
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                setError('Failed to load leaderboard.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getMedalEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return null;
    };

    if (isLoading) {
        return (
            <div className="leaderboard-page">
                <h1 className="leaderboard-title">Leaderboard</h1>
                <div className="leaderboard-loading">Loading leaderboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-page">
                <h1 className="leaderboard-title">Leaderboard</h1>
                <div className="leaderboard-empty">{error}</div>
            </div>
        );
    }

    const safePlayers = leaderboardData.slice(0, 8);
    const atRiskPlayers = leaderboardData.slice(8);

    const renderLeaderboardRow = (leaderboardUser, rank) => {
        const isCurrentUser = user && user.uid === leaderboardUser.id;
        const isSafe = rank <= 8;
        const medal = getMedalEmoji(rank);
        const adventureRank = getAdventureRank(leaderboardUser.points);
        const ascensionPhase = getAscensionPhase(adventureRank);

        return (
            <li
                key={leaderboardUser.id}
                className={`leaderboard-item ${isCurrentUser ? 'leaderboard-item-current' : ''} ${isSafe ? 'leaderboard-item-safe' : ''}`}
            >
                <div className="leaderboard-rank">
                    {medal ? <span className="leaderboard-rank-medal">{medal}</span> : null}
                    <span>{rank}</span>
                </div>

                <div className="leaderboard-user-info">
                    <Link to={`/profile/${leaderboardUser.id}`} className="leaderboard-username-link">
                        {leaderboardUser.photoUrl ? (
                            <img
                                src={leaderboardUser.photoUrl}
                                alt={`${leaderboardUser.username} profile`}
                                className="leaderboard-avatar"
                            />
                        ) : (
                            <span
                                className="leaderboard-avatar-fallback"
                                aria-hidden="true"
                            >
                                {((leaderboardUser.username || '').slice(0, 1).toUpperCase()) || '?'}
                            </span>
                        )}
                    </Link>

                    <div className="leaderboard-user-meta">
                        <Link to={`/profile/${leaderboardUser.id}`} className="leaderboard-username-link">
                            <span className="leaderboard-username">{leaderboardUser.username}</span>
                        </Link>
                        <div className="leaderboard-ar-info" aria-label={`Adventure Rank ${adventureRank}, Ascension phase ${ascensionPhase}`}>
                            <span className="leaderboard-ar-rank">AR {adventureRank}</span>
                            <div className="leaderboard-ar-stars" aria-hidden="true">
                                {Array.from({ length: 6 }, (_, i) => (
                                    <span key={i} className={`leaderboard-ar-star${i < ascensionPhase ? ' leaderboard-ar-star--filled' : ' leaderboard-ar-star--empty'}`}>✦</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="leaderboard-points" aria-label={`Points ${leaderboardUser.points}`}>
                    <img className="leaderboard-points-icon" src={PointsIcon} alt="" aria-hidden="true" />
                    {leaderboardUser.points}
                </div>
            </li>
        );
    };

    return (
        <div className="leaderboard-page">
            <h1 className="leaderboard-title">Leaderboard</h1>

            {leaderboardData.length === 0 ? (
                <div className="leaderboard-empty">No users yet.</div>
            ) : (
                <div className="leaderboard-container">
                    <div className="leaderboard-header">
                        <div className="leaderboard-header-rank">Rank</div>
                        <div className="leaderboard-header-user">User</div>
                        <div className="leaderboard-header-points">Points</div>
                    </div>

                    <div className="leaderboard-groups">
                        <section className="leaderboard-group" aria-label="Safe zone players">
                            <div className="leaderboard-group-label leaderboard-group-label-safe">Safe (Top 8)</div>
                            <ul className="leaderboard-list">
                                {safePlayers.map((leaderboardUser, index) => renderLeaderboardRow(leaderboardUser, index + 1))}
                            </ul>
                        </section>

                        {atRiskPlayers.length > 0 ? (
                            <section className="leaderboard-group leaderboard-group-at-risk" aria-label="At risk players">
                                <div className="leaderboard-group-label leaderboard-group-label-risk">The Mercy of John</div>
                                <ul className="leaderboard-list">
                                    {atRiskPlayers.map((leaderboardUser, index) => renderLeaderboardRow(leaderboardUser, index + 9))}
                                </ul>
                            </section>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;