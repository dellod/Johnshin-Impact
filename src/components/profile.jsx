// React libraries
import React, { useState, useEffect } from "react"
import { useParams } from 'react-router-dom';

// Scripts
import db from "../scripts/firebase";

const Profile = () =>
{
    const { slug } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const docSnapshot = await db.collection("users").doc(slug).get();
                if (docSnapshot.exists) {
                    setUser(docSnapshot.data());
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUser(null);
            }
        };

        fetchUserData();
    }, [slug]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{user.username}'s Profile</h1>
            <img src={user.photoUrl || user.photoURL} alt={`${user.username}'s profile`} />
            <p>Total Points: {user.totalPoints}</p>
        </div>
    );
}

export default Profile;