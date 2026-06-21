// React libraries
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Styles
import '../styles/leaderboard.css';

// Assets
import PointsIcon from '../assets/primogem.png';

// Scripts
import db from "../scripts/firebase";

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

                    <ul className="leaderboard-list">
                        {leaderboardData.map((leaderboardUser, index) => {
                            const rank = index + 1;
                            const isCurrentUser = user && user.uid === leaderboardUser.id;
                            const medal = getMedalEmoji(rank);

                            return (
                                <li
                                    key={leaderboardUser.id}
                                    className={`leaderboard-item ${isCurrentUser ? 'leaderboard-item-current' : ''}`}
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

                                        <Link to={`/profile/${leaderboardUser.id}`} className="leaderboard-username-link">
                                            <span className="leaderboard-username">{leaderboardUser.username}</span>
                                        </Link>
                                    </div>

                                    <div className="leaderboard-points" aria-label={`Points ${leaderboardUser.points}`}>
                                        <img className="leaderboard-points-icon" src={PointsIcon} alt="" aria-hidden="true" />
                                        {leaderboardUser.points}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;