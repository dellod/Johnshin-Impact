// React libraries
import React, { useState, useEffect } from "react";

// CSS
import '../styles/achievements.css';

// Components
import CameraCapture from './cameraCapture';
import AchievementDetailsModal from './achievementDetailsModal';

// Assets
import ArtOfAdventure from '../assets/artofadventure.png';
import Challenger from '../assets/challenger.png';
import Duelist from '../assets/duelist.png';
import MemoriesOfTheHeart from '../assets/memoriesoftheheart.png';
import PointsIcon from '../assets/primogem.png';

// Scripts
import db from "../scripts/firebase";

const CATEGORIES = [
    "The Art of Adventure",
    "Duelist",
    "Challenger",
    "Memories of the Heart",
];

const CATEGORY_IMAGES = {
    "The Art of Adventure": ArtOfAdventure,
    Duelist,
    Challenger,
    "Memories of the Heart": MemoriesOfTheHeart,
};

const getAchievementFields = (achievement, fallbackImage) => {
    const image = achievement.icon || fallbackImage;
    const name = achievement.name || "Unnamed achievement";
    const description = achievement.description || "No description yet.";
    const points = achievement.points ?? 0;

    const rawAchievers = achievement.achievedUsersMap || [];
    let achievers = [];

    if (Array.isArray(rawAchievers)) {
        achievers = rawAchievers
            .map((entry) => {
                if (typeof entry === 'string') {
                    return entry;
                }

                if (entry && typeof entry === 'object') {
                    return entry.username || '';
                }

                return '';
            })
            .filter(Boolean);
    } else if (rawAchievers && typeof rawAchievers === 'object') {
        achievers = Object.keys(rawAchievers);
    }

    return {
        ...achievement,
        image,
        name,
        description,
        points,
        achievers,
    };
};

const Achievements = ({ user }) => {
    // achievementsByCategory: { [category]: Achievement[] }
    const [achievementsByCategory, setAchievementsByCategory] = useState({});
    const [achievementPointMap, setAchievementPointMap] = useState({});
    const [totalAchievementCount, setTotalAchievementCount] = useState(0);
    const [earnedAchievementCount, setEarnedAchievementCount] = useState(0);
    const [completedAchievementIds, setCompletedAchievementIds] = useState({});
    const [totalPoints, setTotalPoints] = useState(0);
    const [openCategories, setOpenCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [activeAchievement, setActiveAchievement] = useState(null);
    const [achieversWithProfiles, setAchieversWithProfiles] = useState([]);
    const [isLoadingAchievers, setIsLoadingAchievers] = useState(false);
    const [isClaimCaptureOpen, setIsClaimCaptureOpen] = useState(false);
    const [claimPhotoFile, setClaimPhotoFile] = useState(null);
    const [claimError, setClaimError] = useState('');
    const [claimSuccess, setClaimSuccess] = useState('');
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
    const [hasPendingClaim, setHasPendingClaim] = useState(false);
    const [isCheckingPendingClaim, setIsCheckingPendingClaim] = useState(false);
    const [pendingClaimIds, setPendingClaimIds] = useState({});

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const snapshot = await db.collection("achievements").get();
                const grouped = {};
                const nextAchievementPointMap = {};
                CATEGORIES.forEach((cat) => { grouped[cat] = []; });

                snapshot.forEach((doc) => {
                    const data = { id: doc.id, ...doc.data() };
                    const parsedPoints = Number(data.points ?? 0);
                    nextAchievementPointMap[doc.id] = Number.isNaN(parsedPoints) ? 0 : parsedPoints;
                    if (grouped[data.category] !== undefined) {
                        grouped[data.category].push(data);
                    }
                });

                setAchievementsByCategory(grouped);
                setAchievementPointMap(nextAchievementPointMap);
                setTotalAchievementCount(snapshot.size);
            } catch (error) {
                console.error("Error fetching achievements:", error);
                setFetchError("Failed to load achievements.");
            } finally {
                setLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    useEffect(() => {
        if (!user) {
            setEarnedAchievementCount(0);
            setCompletedAchievementIds({});
            setTotalPoints(0);
            return undefined;
        }

        let isMounted = true;

        const loadUserAchievementSummary = async () => {
            try {
                const userSnapshot = await db.collection('users').doc(user.uid).get();

                if (!isMounted) {
                    return;
                }

                const userData = userSnapshot.exists ? (userSnapshot.data() || {}) : {};
                const achievementMap = userData.achievements && typeof userData.achievements === 'object'
                    ? userData.achievements
                    : {};
                const achievementIds = Object.keys(achievementMap);
                const nextCompletedAchievementIds = achievementIds.reduce((accumulator, achievementId) => {
                    if (Object.prototype.hasOwnProperty.call(achievementPointMap, achievementId)) {
                        accumulator[achievementId] = true;
                    }

                    return accumulator;
                }, {});

                const earnedCount = Object.keys(nextCompletedAchievementIds).length;
                const nextTotalPoints = achievementIds.reduce((sum, achievementId) => {
                    const points = achievementPointMap[achievementId];
                    return sum + (typeof points === 'number' ? points : 0);
                }, 0);

                setCompletedAchievementIds(nextCompletedAchievementIds);
                setEarnedAchievementCount(earnedCount);
                setTotalPoints(nextTotalPoints);
            } catch (error) {
                console.error('Error loading user achievement summary:', error);
                if (isMounted) {
                    setCompletedAchievementIds({});
                    setEarnedAchievementCount(0);
                    setTotalPoints(0);
                }
            }
        };

        loadUserAchievementSummary();

        return () => {
            isMounted = false;
        };
    }, [user, achievementPointMap]);

    useEffect(() => {
        if (!user) {
            setPendingClaimIds({});
            return undefined;
        }

        let isMounted = true;

        const loadPendingClaims = async () => {
            try {
                const snapshot = await db
                    .collection('achievementClaims')
                    .where('userId', '==', user.uid)
                    .where('status', '==', 'pending')
                    .get();

                if (!isMounted) {
                    return;
                }

                const nextPendingClaimIds = {};
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.achievementId) {
                        nextPendingClaimIds[data.achievementId] = true;
                    }
                });

                setPendingClaimIds(nextPendingClaimIds);
            } catch (error) {
                console.error('Error loading pending claims:', error);
            }
        };

        loadPendingClaims();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const toggleCategory = (category) => {
        setOpenCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const openAchievementModal = async (achievement, categoryImage) => {
        const achievementFields = getAchievementFields(achievement, categoryImage);
        setActiveAchievement(achievementFields);
        setIsLoadingAchievers(true);
        setIsClaimCaptureOpen(false);
        setClaimPhotoFile(null);
        setClaimError('');
        setClaimSuccess('');
        setHasPendingClaim(Boolean(pendingClaimIds[achievement.id]));

        try {
            const rawAchievers = achievement.achievedUsersMap || [];
            const nextAchievers = [];

            if (rawAchievers && typeof rawAchievers === 'object' && !Array.isArray(rawAchievers)) {
                for (const [userId, submissionPhotoUrl] of Object.entries(rawAchievers)) {
                    let username = 'Unknown user';
                    let profilePhotoUrl = '';

                    try {
                        const userDoc = await db.collection('users').doc(userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data() || {};
                            username = userData.username || username;
                            profilePhotoUrl = userData.photoUrl || userData.photoURL || '';
                        }
                    } catch (error) {
                        console.error(`Error loading user profile for ${userId}:`, error);
                    }

                    nextAchievers.push({
                        id: userId,
                        username,
                        profilePhotoUrl,
                        submissionPhotoUrl: submissionPhotoUrl || '',
                    });
                }
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
        setIsClaimCaptureOpen(false);
        setClaimPhotoFile(null);
        setClaimError('');
        setClaimSuccess('');
        setHasPendingClaim(false);
    };

    const checkPendingClaim = async (userId, achievementId) => {
        const snapshot = await db
            .collection('achievementClaims')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .get();

        return snapshot.docs.some((doc) => doc.data().achievementId === achievementId);
    };

    useEffect(() => {
        if (!activeAchievement || !user) {
            setHasPendingClaim(false);
            setIsCheckingPendingClaim(false);
            return undefined;
        }

        let isMounted = true;

        const loadPendingClaim = async () => {
            setIsCheckingPendingClaim(true);

            try {
                const pending = await checkPendingClaim(user.uid, activeAchievement.id);
                if (isMounted) {
                    setHasPendingClaim(pending);
                    if (pending) {
                        setIsClaimCaptureOpen(false);
                        setClaimPhotoFile(null);
                    }
                }
            } catch (error) {
                console.error('Error checking pending achievement claim:', error);
                if (isMounted) {
                    setClaimError('Unable to verify existing claim status right now.');
                }
            } finally {
                if (isMounted) {
                    setIsCheckingPendingClaim(false);
                }
            }
        };

        loadPendingClaim();

        return () => {
            isMounted = false;
        };
    }, [activeAchievement, user, pendingClaimIds]);

    const handleClaimSubmit = async () => {
        if (!user) {
            setClaimError('Please log in to claim this achievement.');
            return;
        }

        if (!claimPhotoFile) {
            setClaimError('Please capture a photo before submitting your claim.');
            return;
        }

        const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.REACT_APP_CLOUDINARY_PROFILE_UPLOAD_PRESET;
        const uploadFolder = process.env.REACT_APP_CLOUDINARY_ACHIEVEMENT_CLAIM_UPLOAD_FOLDER;

        if (!cloudName || !uploadPreset) {
            setClaimError('Cloudinary config is missing for achievement claims.');
            return;
        }

        setClaimError('');
        setClaimSuccess('');
        setIsSubmittingClaim(true);

        try {
            const pending = await checkPendingClaim(user.uid, activeAchievement.id);
            if (pending) {
                setHasPendingClaim(true);
                setIsClaimCaptureOpen(false);
                setClaimPhotoFile(null);
                setClaimError('You already have a pending claim for this achievement.');
                return;
            }

            const formData = new FormData();
            formData.append('file', claimPhotoFile);
            formData.append('upload_preset', uploadPreset);
            if (uploadFolder) {
                formData.append('folder', uploadFolder);
            }

            const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok) {
                throw new Error(uploadResult.error?.message || 'Image upload failed.');
            }

            await db.collection('achievementClaims').add({
                achievementId: activeAchievement.id,
                achievementName: activeAchievement.name,
                achievementCategory: activeAchievement.category,
                achievementPoints: activeAchievement.points,
                userId: user.uid,
                username: user.displayName || 'Unknown user',
                photoUrl: uploadResult.secure_url,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });

            setHasPendingClaim(true);
            setPendingClaimIds((currentPendingClaimIds) => ({
                ...currentPendingClaimIds,
                [activeAchievement.id]: true,
            }));
            setClaimSuccess('Claim submitted successfully.');
            setIsClaimCaptureOpen(false);
            setClaimPhotoFile(null);
        } catch (error) {
            console.error('Error submitting achievement claim:', error);
            setClaimError(error.message || 'Failed to submit claim.');
        } finally {
            setIsSubmittingClaim(false);
        }
    };

    if (loading) {
        return <div className="achievements-loading">Loading achievements...</div>;
    }

    if (fetchError) {
        return <div className="achievements-error">{fetchError}</div>;
    }

    const claimContent = (
        <>
            {!user ? (
                <p className="achievement-modal-empty">Log in to claim this achievement.</p>
            ) : isCheckingPendingClaim ? (
                <p className="achievement-modal-empty">Checking claim status...</p>
            ) : completedAchievementIds[activeAchievement?.id] ? (
                <p className="achievement-modal-empty">You have already completed this achievement.</p>
            ) : hasPendingClaim ? (
                <p className="achievement-modal-empty">You already have a pending claim for this achievement.</p>
            ) : (
                <>
                    {!isClaimCaptureOpen ? (
                        <button
                            type="button"
                            className="achievement-claim-btn"
                            onClick={() => {
                                setIsClaimCaptureOpen(true);
                                setClaimError('');
                                setClaimSuccess('');
                            }}
                            disabled={hasPendingClaim || isCheckingPendingClaim}
                        >
                            Claim Achievement
                        </button>
                    ) : (
                        <div className="achievement-claim-capture">
                            <CameraCapture
                                label="Take a photo for your claim"
                                onCapture={(file) => {
                                    setClaimPhotoFile(file);
                                    setClaimError('');
                                }}
                            />

                            <button
                                type="button"
                                className="achievement-claim-submit"
                                onClick={handleClaimSubmit}
                                disabled={!claimPhotoFile || isSubmittingClaim}
                            >
                                {isSubmittingClaim ? 'Submitting...' : 'Submit Claim'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {claimError ? <p className="achievement-claim-error">{claimError}</p> : null}
            {claimSuccess ? <p className="achievement-claim-success">{claimSuccess}</p> : null}
        </>
    );

    return (
        <div className="achievements-page">
            <h1 className="achievements-title">Achievements</h1>
            <div className="achievements-summary" aria-label="Achievement summary">
                <div className="achievements-summary-card">
                    <img src={PointsIcon} className="achievements-summary-icon" alt="Points" />
                    <span className="achievements-summary-value">{totalPoints}</span>
                </div>
                <div className="achievements-summary-card achievements-summary-count">
                    <span className="achievements-summary-value">{earnedAchievementCount}/{totalAchievementCount}</span>
                    <span className="achievements-summary-label">Achievements</span>
                </div>
            </div>
            <div className="achievements-list">
                {CATEGORIES.map((category) => {
                    const isOpen = Boolean(openCategories[category]);
                    const items = achievementsByCategory[category] || [];
                    const categoryImage = CATEGORY_IMAGES[category];
                    const sortedItems = [...items].sort((leftAchievement, rightAchievement) => {
                        const leftIsPending = Boolean(pendingClaimIds[leftAchievement.id]);
                        const rightIsPending = Boolean(pendingClaimIds[rightAchievement.id]);
                        const leftIsCompleted = Boolean(completedAchievementIds[leftAchievement.id]);
                        const rightIsCompleted = Boolean(completedAchievementIds[rightAchievement.id]);

                        if (leftIsPending !== rightIsPending) {
                            return leftIsPending ? -1 : 1;
                        }

                        if (leftIsCompleted !== rightIsCompleted) {
                            return leftIsCompleted ? 1 : -1;
                        }

                        return 0;
                    });

                    return (
                        <div key={category} className="achievement-category">
                            <button
                                className={`category-header ${isOpen ? "category-header-open" : ""}`}
                                onClick={() => toggleCategory(category)}
                                aria-expanded={isOpen}
                            >
                                <img className="category-icon" src={categoryImage} alt={`${category} icon`} />
                                <span className="category-name">{category}</span>
                                <span className="category-count">{items.length}</span>
                                <span className="category-chevron" aria-hidden="true">
                                    {isOpen ? "▲" : "▼"}
                                </span>
                            </button>

                            {isOpen ? (
                                <ul className="achievement-items">
                                    {items.length === 0 ? (
                                        <li className="achievement-empty">No achievements yet.</li>
                                    ) : (
                                        sortedItems.map((achievement) => {
                                            const achievementFields = getAchievementFields(achievement, categoryImage);
                                            const isPending = Boolean(pendingClaimIds[achievement.id]);
                                            const isCompleted = Boolean(completedAchievementIds[achievement.id]);

                                            return (
                                                <li
                                                    key={achievement.id}
                                                    className={`achievement-item achievement-item-clickable ${isPending ? 'achievement-item-pending' : ''} ${isCompleted ? 'achievement-item-completed' : ''}`}
                                                    onClick={() => openAchievementModal(achievement, categoryImage)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            openAchievementModal(achievement, categoryImage);
                                                        }
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <img
                                                        className="achievement-item-icon"
                                                        src={achievementFields.image}
                                                        alt={`${achievementFields.name} icon`}
                                                    />

                                                    <div className="achievement-item-content">
                                                        <div className="achievement-item-title-row">
                                                            <div className="achievement-item-title">{achievementFields.name}</div>
                                                            {isPending ? <span className="achievement-status-badge">Pending Review</span> : null}
                                                            {isCompleted ? <span className="achievement-status-badge achievement-status-badge-completed">Completed</span> : null}
                                                        </div>
                                                        <div className="achievement-item-desc">{achievementFields.description}</div>
                                                    </div>

                                                    <div className="achievement-item-points" aria-label={`${achievementFields.points}`}>
                                                        <img className="achievement-points-icon" src={PointsIcon} alt="" aria-hidden="true" />
                                                        {achievementFields.points}
                                                    </div>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {activeAchievement ? (
                <AchievementDetailsModal
                    achievement={activeAchievement}
                    onClose={closeAchievementModal}
                    onProfileNavigate={closeAchievementModal}
                    isLoadingAchievers={isLoadingAchievers}
                    achieversWithProfiles={achieversWithProfiles}
                    claimContent={claimContent}
                />
            ) : null}
        </div>
    );
};

export default Achievements;