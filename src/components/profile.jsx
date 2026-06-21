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