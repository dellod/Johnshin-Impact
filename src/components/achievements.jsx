// React libraries
import React, { useState, useEffect } from "react";

// CSS
import '../styles/achievements.css';

// Components
import CameraCapture from './cameraCapture';

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

    const rawAchievers = achievement.achievedUsers || achievement.achievedBy || achievement.usersAchieved || [];
    const achievers = Array.isArray(rawAchievers)
        ? rawAchievers
            .map((entry) => {
                if (typeof entry === 'string') {
                    return entry;
                }

                if (entry && typeof entry === 'object') {
                    return entry.username || entry.displayName || entry.name || entry.userId || '';
                }

                return '';
            })
            .filter(Boolean)
        : [];

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
    const [openCategories, setOpenCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [activeAchievement, setActiveAchievement] = useState(null);
    const [isClaimCaptureOpen, setIsClaimCaptureOpen] = useState(false);
    const [claimPhotoFile, setClaimPhotoFile] = useState(null);
    const [claimError, setClaimError] = useState('');
    const [claimSuccess, setClaimSuccess] = useState('');
    const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const snapshot = await db.collection("achievements").get();
                const grouped = {};
                CATEGORIES.forEach((cat) => { grouped[cat] = []; });

                snapshot.forEach((doc) => {
                    const data = { id: doc.id, ...doc.data() };
                    if (grouped[data.category] !== undefined) {
                        grouped[data.category].push(data);
                    }
                });

                setAchievementsByCategory(grouped);
            } catch (error) {
                console.error("Error fetching achievements:", error);
                setFetchError("Failed to load achievements.");
            } finally {
                setLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    const toggleCategory = (category) => {
        setOpenCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const openAchievementModal = (achievement, categoryImage) => {
        setActiveAchievement(getAchievementFields(achievement, categoryImage));
        setIsClaimCaptureOpen(false);
        setClaimPhotoFile(null);
        setClaimError('');
        setClaimSuccess('');
    };

    const closeAchievementModal = () => {
        setActiveAchievement(null);
        setIsClaimCaptureOpen(false);
        setClaimPhotoFile(null);
        setClaimError('');
        setClaimSuccess('');
        setIsImagePreviewOpen(false);
    };

    useEffect(() => {
        if (!activeAchievement) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                if (isImagePreviewOpen) {
                    setIsImagePreviewOpen(false);
                    return;
                }

                closeAchievementModal();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [activeAchievement, isImagePreviewOpen]);

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
        const uploadPreset = process.env.REACT_APP_CLOUDINARY_ACHIEVEMENT_UPLOAD_PRESET || process.env.REACT_APP_CLOUDINARY_PROFILE_UPLOAD_PRESET;
        const uploadFolder = process.env.REACT_APP_CLOUDINARY_ACHIEVEMENT_UPLOAD_FOLDER || process.env.REACT_APP_CLOUDINARY_PROFILE_UPLOAD_FOLDER;

        if (!cloudName || !uploadPreset) {
            setClaimError('Cloudinary config is missing for achievement claims.');
            return;
        }

        setClaimError('');
        setClaimSuccess('');
        setIsSubmittingClaim(true);

        try {
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

    return (
        <div className="achievements-page">
            <h1 className="achievements-title">Achievements</h1>
            <div className="achievements-list">
                {CATEGORIES.map((category) => {
                    const isOpen = !!openCategories[category];
                    const items = achievementsByCategory[category] || [];
                    const categoryImage = CATEGORY_IMAGES[category];

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

                            {isOpen && (
                                <ul className="achievement-items">
                                    {items.length === 0 ? (
                                        <li className="achievement-empty">No achievements yet.</li>
                                    ) : (
                                        items.map((achievement) => {
                                            const achievementFields = getAchievementFields(achievement, categoryImage);

                                            return (
                                                <li
                                                    key={achievement.id}
                                                    className="achievement-item achievement-item-clickable"
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
                                                        <div className="achievement-item-title">{achievementFields.name}</div>
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
                            )}
                        </div>
                    );
                })}
            </div>

            {activeAchievement && (
                <div className="achievement-modal-backdrop" onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        closeAchievementModal();
                    }
                }}>
                    <div className="achievement-modal" role="dialog" aria-modal="true" aria-label="Achievement details">
                        <button className="achievement-modal-close" type="button" onClick={closeAchievementModal} aria-label="Close achievement details">
                            x
                        </button>

                        <div className="achievement-modal-header">
                            <button
                                type="button"
                                className="achievement-modal-icon-button"
                                onClick={() => setIsImagePreviewOpen(true)}
                                aria-label="Open achievement icon preview"
                            >
                                <img className="achievement-modal-icon" src={activeAchievement.image} alt={`${activeAchievement.name} icon`} />
                            </button>
                            <div>
                                <h2 className="achievement-modal-title">{activeAchievement.name}</h2>
                                <p className="achievement-modal-category">{activeAchievement.category}</p>
                            </div>
                        </div>

                        <p className="achievement-modal-description">{activeAchievement.description}</p>

                        <div className="achievement-modal-points" aria-label={`Points ${activeAchievement.points}`}>
                            <img className="achievement-points-icon" src={PointsIcon} alt="" aria-hidden="true" />
                            {activeAchievement.points}
                        </div>

                        <div className="achievement-modal-achievers">
                            <h3>Users who achieved this</h3>
                            {activeAchievement.achievers.length > 0 ? (
                                <ul className="achievement-modal-achievers-list">
                                    {activeAchievement.achievers.map((achiever) => (
                                        <li key={achiever}>{achiever}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="achievement-modal-empty">Be the first to achieve this.</p>
                            )}
                        </div>

                        <div className="achievement-modal-claim">
                            {!user ? (
                                <p className="achievement-modal-empty">Log in to claim this achievement.</p>
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
                        </div>
                    </div>
                </div>
            )}

            {activeAchievement && isImagePreviewOpen && (
                <div
                    className="achievement-image-preview-backdrop"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsImagePreviewOpen(false);
                        }
                    }}
                >
                    <div className="achievement-image-preview-modal" role="dialog" aria-modal="true" aria-label="Achievement icon preview">
                        <button
                            type="button"
                            className="achievement-image-preview-close"
                            onClick={() => setIsImagePreviewOpen(false)}
                            aria-label="Close icon preview"
                        >
                            x
                        </button>

                        <img
                            className="achievement-image-preview-img"
                            src={activeAchievement.image}
                            alt={`${activeAchievement.name} large preview`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Achievements;