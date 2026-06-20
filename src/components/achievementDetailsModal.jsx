import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import '../styles/achievements.css';
import PointsIcon from '../assets/primogem.png';

const AchievementDetailsModal = ({
    achievement,
    onClose,
    onProfileNavigate,
    isLoadingAchievers,
    achieversWithProfiles,
    claimContent = null,
    emptyAchieversText = 'Be the first to achieve this.',
}) => {
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [activeSubmissionPreviewImage, setActiveSubmissionPreviewImage] = useState('');

    useEffect(() => {
        if (!achievement) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key !== 'Escape') {
                return;
            }

            if (activeSubmissionPreviewImage) {
                setActiveSubmissionPreviewImage('');
                return;
            }

            if (isImagePreviewOpen) {
                setIsImagePreviewOpen(false);
                return;
            }

            onClose();
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [achievement, isImagePreviewOpen, activeSubmissionPreviewImage, onClose]);

    if (!achievement) {
        return null;
    }

    return (
        <>
            <div className="achievement-modal-backdrop" onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}>
                <div className="achievement-modal" role="dialog" aria-modal="true" aria-label="Achievement details">
                    <button className="achievement-modal-close" type="button" onClick={onClose} aria-label="Close achievement details">
                        x
                    </button>

                    <div className="achievement-modal-header">
                        <button
                            type="button"
                            className="achievement-modal-icon-button"
                            onClick={() => setIsImagePreviewOpen(true)}
                            aria-label="Open achievement icon preview"
                        >
                            <img className="achievement-modal-icon" src={achievement.image} alt={`${achievement.name} icon`} />
                        </button>
                        <div>
                            <h2 className="achievement-modal-title">{achievement.name}</h2>
                            <p className="achievement-modal-category">{achievement.category}</p>
                        </div>
                    </div>

                    <p className="achievement-modal-description">{achievement.description}</p>

                    <div className="achievement-modal-points" aria-label={`Points ${achievement.points}`}>
                        <img className="achievement-points-icon" src={PointsIcon} alt="" aria-hidden="true" />
                        {achievement.points}
                    </div>

                    {claimContent ? (
                        <div className="achievement-modal-claim">
                            {claimContent}
                        </div>
                    ) : null}

                    <div className="achievement-modal-achievers">
                        <h3>Users who achieved this</h3>
                        {isLoadingAchievers ? (
                            <p className="achievement-modal-empty">Loading achievers...</p>
                        ) : achieversWithProfiles.length > 0 ? (
                            <ul className="achievement-modal-achievers-list">
                                {achieversWithProfiles.map((achiever) => (
                                    <li key={achiever.id} className="achievement-modal-achiever-item">
                                        <Link
                                            to={`/profile/${achiever.id}`}
                                            className="achievement-modal-achiever-identity achievement-modal-achiever-identity-link"
                                            onClick={() => {
                                                if (typeof onProfileNavigate === 'function') {
                                                    onProfileNavigate(achiever.id);
                                                }
                                            }}
                                        >
                                            {achiever.profilePhotoUrl ? (
                                                <img
                                                    src={achiever.profilePhotoUrl}
                                                    alt={`${achiever.username} profile`}
                                                    className="achievement-modal-achiever-profile"
                                                />
                                            ) : (
                                                <span className="achievement-modal-achiever-profile achievement-modal-achiever-profile-fallback" aria-hidden="true">
                                                    {((achiever.username || '').slice(0, 1).toUpperCase()) || '?'}
                                                </span>
                                            )}
                                            <p className="achievement-modal-achiever-name">{achiever.username}</p>
                                        </Link>

                                        {achiever.submissionPhotoUrl ? (
                                            <img
                                                src={achiever.submissionPhotoUrl}
                                                alt={`${achiever.username} submission`}
                                                className="achievement-modal-achiever-submission"
                                                onClick={() => setActiveSubmissionPreviewImage(achiever.submissionPhotoUrl)}
                                            />
                                        ) : (
                                            <p className="achievement-modal-achiever-missing">No submission image saved.</p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="achievement-modal-empty">{emptyAchieversText}</p>
                        )}
                    </div>
                </div>
            </div>

            {isImagePreviewOpen ? (
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
                            src={achievement.image}
                            alt={`${achievement.name} large preview`}
                        />
                    </div>
                </div>
            ) : null}

            {activeSubmissionPreviewImage ? (
                <div
                    className="achievement-image-preview-backdrop"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setActiveSubmissionPreviewImage('');
                        }
                    }}
                >
                    <div className="achievement-image-preview-modal" role="dialog" aria-modal="true" aria-label="Achievement submission image preview">
                        <button
                            type="button"
                            className="achievement-image-preview-close"
                            onClick={() => setActiveSubmissionPreviewImage('')}
                            aria-label="Close submission image preview"
                        >
                            x
                        </button>

                        <img
                            className="achievement-image-preview-img"
                            src={activeSubmissionPreviewImage}
                            alt="Achievement submission preview"
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default AchievementDetailsModal;
