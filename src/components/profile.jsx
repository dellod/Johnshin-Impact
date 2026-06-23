// React libraries
import React, { useState, useEffect } from "react"
import { useParams } from 'react-router-dom';

// Styles
import '../styles/profile.css';

// Assets
import PointsIcon from '../assets/primogem.png';

// Components
import AchievementDetailsModal from './achievementDetailsModal';

// Scripts
import db from "../scripts/firebase";

// Adventure rank constants
const MAX_AR_LEVEL = 60;
const AR_LEVEL_CAP_POINTS = 1200; // level 60 is reached at 1200 pts; points above this are surplus

// Returns cumulative XP threshold for a given level (1-indexed)
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

function getARProgress(points) {
    const level = getAdventureRank(points);
    if (level >= MAX_AR_LEVEL) return { intoLevel: 0, levelSize: 0, percentage: 100 };
    const capped = Math.min(points, AR_LEVEL_CAP_POINTS);
    const currentThreshold = arThreshold(level);
    const nextThreshold = arThreshold(level + 1);
    const levelSize = nextThreshold - currentThreshold;
    const intoLevel = capped - currentThreshold;
    const percentage = levelSize > 0 ? Math.round((intoLevel / levelSize) * 100) : 100;
    return { intoLevel, levelSize, percentage };
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

const Profile = () =>
{
    const { slug } = useParams();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPoints, setTotalPoints] = useState(0);
    const [earnedAchievements, setEarnedAchievements] = useState([]);
    const [activeAchievement, setActiveAchievement] = useState(null);
    const [achieversWithProfiles, setAchieversWithProfiles] = useState([]);
    const [isLoadingAchievers, setIsLoadingAchievers] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            setActiveAchievement(null);
            setAchieversWithProfiles([]);

            try {
                const docSnapshot = await db.collection("users").doc(slug).get();
                if (docSnapshot.exists) {
                    const userData = docSnapshot.data() || {};
                    setUser(userData);

                    const achievementMap = userData.achievements && typeof userData.achievements === 'object'
                        ? userData.achievements
                        : userData.achievementsMap && typeof userData.achievementsMap === 'object'
                            ? userData.achievementsMap
                            : userData.achievedAchievements && typeof userData.achievedAchievements === 'object'
                                ? userData.achievedAchievements
                                : {};

                    const achievementIds = Object.keys(achievementMap);

                    if (achievementIds.length === 0) {
                        setTotalPoints(0);
                        setEarnedAchievements([]);
                        return;
                    }

                    const achievementSnapshots = await Promise.all(
                        achievementIds.map((achievementId) => db.collection('achievements').doc(achievementId).get())
                    );

                    const nextEarnedAchievements = achievementSnapshots
                        .filter((achievementSnapshot) => achievementSnapshot.exists)
                        .map((achievementSnapshot) => {
                            const achievementData = achievementSnapshot.data() || {};
                            const parsedPoints = Number(achievementData.points ?? 0);
                            const achievedUsersMap = achievementData.achievedUsersMap && typeof achievementData.achievedUsersMap === 'object'
                                ? achievementData.achievedUsersMap
                                : {};

                            return {
                                id: achievementSnapshot.id,
                                name: achievementData.name || 'Unnamed achievement',
                                points: Number.isNaN(parsedPoints) ? 0 : parsedPoints,
                                category: achievementData.category || 'Uncategorized',
                                image: achievementData.icon || '',
                                description: achievementData.description || 'No description yet.',
                                achievedUsersMap,
                                submissionPhotoUrl: achievedUsersMap[slug] || '',
                            };
                        });

                    const nextTotalPoints = nextEarnedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);

                    setTotalPoints(nextTotalPoints);
                    setEarnedAchievements(nextEarnedAchievements);
                } else {
                    setUser(null);
                    setTotalPoints(0);
                    setEarnedAchievements([]);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUser(null);
                setTotalPoints(0);
                setEarnedAchievements([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [slug]);

    const openAchievementModal = async (achievement) => {
        setActiveAchievement(achievement);
        setIsLoadingAchievers(true);

        try {
            const rawAchievers = achievement.achievedUsersMap || [];
            const nextAchievers = [];

            if (rawAchievers && typeof rawAchievers === 'object' && !Array.isArray(rawAchievers)) {
                const achieverEntries = Object.entries(rawAchievers);
                const userDocs = await Promise.all(
                    achieverEntries.map(([userId]) =>
                        db.collection('users').doc(userId).get().catch(() => null)
                    )
                );
                achieverEntries.forEach(([userId, submissionPhotoUrl], index) => {
                    const userDoc = userDocs[index];
                    let username = 'Unknown user';
                    let profilePhotoUrl = '';
                    if (userDoc && userDoc.exists) {
                        const userData = userDoc.data() || {};
                        username = userData.username || username;
                        profilePhotoUrl = userData.photoUrl || userData.photoURL || '';
                    }
                    nextAchievers.push({
                        id: userId,
                        username,
                        profilePhotoUrl,
                        submissionPhotoUrl: submissionPhotoUrl || '',
                    });
                });
            } else if (Array.isArray(rawAchievers)) {
                rawAchievers.forEach((entry, index) => {
                    if (typeof entry === 'string' && entry) {
                        nextAchievers.push({
                            id: `legacy-${index}-${entry}`,
                            username: entry,
                            profilePhotoUrl: '',
                            submissionPhotoUrl: '',
                        });
                        return;
                    }

                    if (entry && typeof entry === 'object') {
                        nextAchievers.push({
                            id: entry.userId || `legacy-${index}`,
                            username: entry.username || 'Unknown user',
                            profilePhotoUrl: entry.photoUrl || entry.photoURL || '',
                            submissionPhotoUrl: entry.submissionPhotoUrl || entry.claimPhotoUrl || '',
                        });
                    }
                });
            }

            setAchieversWithProfiles(nextAchievers);
        } catch (error) {
            console.error('Error building achiever list:', error);
            setAchieversWithProfiles([]);
        } finally {
            setIsLoadingAchievers(false);
        }
    };

    const closeAchievementModal = () => {
        setActiveAchievement(null);
        setAchieversWithProfiles([]);
        setIsLoadingAchievers(false);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>User not found.</div>;
    }

    return (
        <div className="profile-page">
            <h1 className ="username-title">{user.username}</h1>
            <img className="profile-pic" src={user.photoUrl || user.photoURL} alt={`${user.username}'s profile`} />

            <h2 className="profile-fav-john">My favourite thing about John is {user.favJohn}</h2>

            <div className="profile-points" aria-label="Total points">
                <img src={PointsIcon} className="profile-points-icon" alt="Points" />
                <span className="profile-points-value">{totalPoints}</span>
            </div>

            {(() => {
                const adventureRank = getAdventureRank(totalPoints);
                const arProgress = getARProgress(totalPoints);
                const ascensionPhase = getAscensionPhase(adventureRank);
                return (
                    <div className="profile-ar">
                        <div className="profile-ar-top">
                            <span className="profile-ar-label">Adventure Rank</span>
                            <span className="profile-ar-level">{adventureRank}</span>
                        </div>
                        <div className="profile-ar-stars" aria-label={`Ascension phase ${ascensionPhase} of 6`}>
                            {Array.from({ length: 6 }, (_, i) => (
                                <span
                                    key={i}
                                    className={`profile-ar-star${i < ascensionPhase ? ' profile-ar-star--filled' : ' profile-ar-star--empty'}`}
                                    aria-hidden="true"
                                >✦</span>
                            ))}
                        </div>
                        <div
                            className="profile-ar-bar"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={arProgress.percentage}
                        >
                            <div className="profile-ar-bar-fill" style={{ width: `${arProgress.percentage}%` }} />
                        </div>
                        {adventureRank < MAX_AR_LEVEL ? (
                            <p className="profile-ar-progress-text">{arProgress.intoLevel} / {arProgress.levelSize} points to next rank</p>
                        ) : (
                            <p className="profile-ar-progress-text">Max Rank</p>
                        )}
                    </div>
                );
            })()}

            <section className="profile-achievements" aria-label="Completed achievements">
                <h2 className="profile-achievements-title">Completed Achievements</h2>
                {earnedAchievements.length === 0 ? (
                    <p className="profile-achievements-empty">No completed achievements yet.</p>
                ) : (
                    <ul className="profile-achievements-list">
                        {earnedAchievements.map((achievement) => (
                            <li
                                key={achievement.id}
                                className="profile-achievement-item"
                                onClick={() => openAchievementModal(achievement)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        openAchievementModal(achievement);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="profile-achievement-main">
                                    {achievement.image ? (
                                        <img
                                            src={achievement.image}
                                            alt={`${achievement.name} icon`}
                                            className="profile-achievement-icon"
                                        />
                                    ) : (
                                        <span className="profile-achievement-icon profile-achievement-icon-fallback" aria-hidden="true">
                                            ?
                                        </span>
                                    )}

                                    <p className="profile-achievement-name">{achievement.name}</p>
                                    <p className="profile-achievement-category">{achievement.category}</p>
                                </div>
                                <span className="profile-achievement-points">
                                    <img src={PointsIcon} className="profile-achievement-points-icon" alt="" aria-hidden="true" />
                                    {achievement.points}
                                </span>

                                {achievement.submissionPhotoUrl ? (
                                    <img
                                        src={achievement.submissionPhotoUrl}
                                        alt={`${achievement.name} submission`}
                                        className="profile-achievement-submission"
                                    />
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {activeAchievement ? (
                <AchievementDetailsModal
                    achievement={activeAchievement}
                    onClose={closeAchievementModal}
                    onProfileNavigate={closeAchievementModal}
                    isLoadingAchievers={isLoadingAchievers}
                    achieversWithProfiles={achieversWithProfiles}
                />
            ) : null}
        </div>
    );
}

export default Profile;