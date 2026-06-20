// React libraries
import React, { useEffect, useState } from "react";

// CSS
import '../styles/admin.css';

// Scripts
import db from "../scripts/firebase";

const formatSubmittedAt = (createdAt) => {
    if (!createdAt) {
        return 'Unknown date';
    }

    const parsedDate = new Date(createdAt);
    if (Number.isNaN(parsedDate.getTime())) {
        return createdAt;
    }

    return parsedDate.toLocaleString();
};

const Admin = ({ user }) => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [activeClaimId, setActiveClaimId] = useState('');

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const snapshot = await db.collection('achievementClaims').get();
                const nextClaims = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .sort((leftClaim, rightClaim) => {
                        const leftTime = new Date(leftClaim.createdAt || 0).getTime();
                        const rightTime = new Date(rightClaim.createdAt || 0).getTime();
                        return rightTime - leftTime;
                    });

                setClaims(nextClaims);
                setFetchError('');
            } catch (error) {
                console.error('Error loading achievement claims:', error);
                setFetchError('Unable to load achievement claims.');
            } finally {
                setLoading(false);
            }
        };

        fetchClaims();
    }, []);

    const removeClaimFromList = (claimId) => {
        setClaims((currentClaims) => currentClaims.filter((claim) => claim.id !== claimId));
    };

    const handleApprove = async (claim) => {
        setActiveClaimId(claim.id);

        try {
            const achievementRef = db.collection('achievements').doc(claim.achievementId);
            const claimRef = db.collection('achievementClaims').doc(claim.id);
            const userRef = db.collection('users').doc(claim.userId);
            const achievementSnapshot = await achievementRef.get();
            const userSnapshot = await userRef.get();

            if (!achievementSnapshot.exists) {
                throw new Error('Achievement no longer exists.');
            }

            const achievementData = achievementSnapshot.data() || {};
            const existingUserMap = achievementData.achievedUsersMap && typeof achievementData.achievedUsersMap === 'object'
                ? achievementData.achievedUsersMap
                : {};

            await achievementRef.set({
                achievedUsersMap: {
                    ...existingUserMap,
                    [claim.userId]: claim.photoUrl,
                },
            }, { merge: true });

            if (userSnapshot.exists) {
                const userData = userSnapshot.data() || {};
                const existingAchievementsMap = userData.achievementsMap && typeof userData.achievementsMap === 'object'
                    ? userData.achievementsMap
                    : {};

                await userRef.set({
                    achievementsMap: {
                        ...existingAchievementsMap,
                        [claim.achievementId]: claim.photoUrl,
                    },
                }, { merge: true });
            }

            await claimRef.delete();
            removeClaimFromList(claim.id);
        } catch (error) {
            console.error('Error approving achievement claim:', error);
            setFetchError(error.message || 'Unable to approve claim.');
        } finally {
            setActiveClaimId('');
        }
    };

    const handleReject = async (claim) => {
        setActiveClaimId(claim.id);

        try {
            await db.collection('achievementClaims').doc(claim.id).delete();
            removeClaimFromList(claim.id);
        } catch (error) {
            console.error('Error rejecting achievement claim:', error);
            setFetchError(error.message || 'Unable to reject claim.');
        } finally {
            setActiveClaimId('');
        }
    };

    if (!user) {
        return <div className="admin-page admin-empty-state">Log in to review achievement claims.</div>;
    }

    if (loading) {
        return <div className="admin-page admin-empty-state">Loading achievement claims...</div>;
    }

    return (
        <section className="admin-page">
            <div className="admin-panel">
                <h1 className="admin-title">Achievement Claims</h1>
                {fetchError ? <p className="admin-error">{fetchError}</p> : null}

                {claims.length === 0 ? (
                    <p className="admin-empty-state">No achievement claims are waiting for review.</p>
                ) : (
                    <div className="admin-claims-list">
                        {claims.map((claim) => {
                            const isActingOnClaim = activeClaimId === claim.id;

                            return (
                                <article key={claim.id} className="admin-claim-card">
                                    <img className="admin-claim-photo" src={claim.photoUrl} alt={`${claim.achievementName || 'Achievement'} claim`} />

                                    <div className="admin-claim-content">
                                        <div className="admin-claim-topline">
                                            <h2 className="admin-claim-title">{claim.achievementName || 'Unnamed achievement'}</h2>
                                            <span className="admin-claim-status">Pending</span>
                                        </div>

                                        <p className="admin-claim-meta">Category: {claim.achievementCategory || 'Unknown category'}</p>
                                        <p className="admin-claim-meta">Points: {claim.achievementPoints ?? 0}</p>
                                        <p className="admin-claim-meta">User: {claim.username || claim.userId}</p>
                                        <p className="admin-claim-meta">User ID: {claim.userId}</p>
                                        <p className="admin-claim-meta">Submitted: {formatSubmittedAt(claim.createdAt)}</p>

                                        <div className="admin-claim-actions">
                                            <button
                                                type="button"
                                                className="admin-action-btn admin-action-approve"
                                                onClick={() => handleApprove(claim)}
                                                disabled={isActingOnClaim}
                                            >
                                                {isActingOnClaim ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-action-btn admin-action-reject"
                                                onClick={() => handleReject(claim)}
                                                disabled={isActingOnClaim}
                                            >
                                                {isActingOnClaim ? 'Processing...' : 'Reject'}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Admin;
