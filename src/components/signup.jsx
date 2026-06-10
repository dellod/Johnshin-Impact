// React libraries
import React, { useState } from "react";

// CSS
import '../styles/signup.css';

// Components
import CameraCapture from './cameraCapture';

// Scripts
import db, { auth } from "../scripts/firebase";

const buildAuthEmail = (username) => `${username.trim().toLowerCase()}@johnshin.local`;

const getSignupErrorMessage = (error) => {
    if (error?.code === 'auth/email-already-in-use') {
        return 'That username is already taken.';
    }

    if (error?.code === 'auth/invalid-email' || error?.code === 'auth/weak-password') {
        return 'Unable to create account with that username.';
    }

    return error?.message || 'Unable to upload image right now.';
};

const Signup = () =>
{
    const [username, setUsername] = useState("");
    const [favJohn, setFavJohn] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [submitProgress, setSubmitProgress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const timeoutPromise = (promise, timeoutMs, timeoutMessage) => {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        });

        return Promise.race([promise, timeout]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!photoFile) {
            setSubmitError('Please capture a photo before signing up.');
            return;
        }

        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            setSubmitError('Username is required.');
            return;
        }

        const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.REACT_APP_CLOUDINARY_PROFILE_UPLOAD_PRESET;
        const uploadFolder = process.env.REACT_APP_CLOUDINARY_PROFILE_UPLOAD_FOLDER;

        if (!cloudName || !uploadPreset) {
            setSubmitError('Cloudinary config is missing. Add REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_PROFILE_UPLOAD_PRESET.');
            return;
        }

        setSubmitError('');
        setSubmitSuccess('');
        setSubmitProgress('Uploading image...');
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('file', photoFile);
            formData.append('upload_preset', uploadPreset);
            if (uploadFolder) {
                formData.append('folder', uploadFolder);
            }

            const response = await timeoutPromise(
                fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData
                }),
                20000,
                'Cloudinary upload timed out. Check your network and upload preset.'
            );

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error?.message || 'Cloudinary upload failed.');
            }

            setSubmitProgress('Saving profile...');
            const authEmail = buildAuthEmail(normalizedUsername);
            const authCredential = await timeoutPromise(
                auth.createUserWithEmailAndPassword(authEmail, normalizedUsername),
                15000,
                'Creating Firebase auth user timed out.'
            );

            if (authCredential.user) {
                await authCredential.user.updateProfile({
                    displayName: normalizedUsername
                });
            }

            const userDocRef = db.collection('users').doc(authCredential.user.uid);
            await timeoutPromise(
                userDocRef.set({
                    id: authCredential.user.uid,
                    authEmail,
                    username: normalizedUsername,
                    favJohn: favJohn.trim(),
                    photoUrl: result.secure_url
                }),
                15000,
                'Saving to Firebase timed out. Check Firestore rules and Firebase config.'
            );

            setSubmitSuccess('Image uploaded successfully.');
            setSubmitProgress('');
            console.log('Cloudinary uploaded image URL:', result.secure_url);
        } catch (error) {
            setSubmitProgress('');
            setSubmitError(getSignupErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup">
            <h1>Signup</h1>
            <form className="signup-form" onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
                <input type="text" placeholder="Fav thing about John?" onChange={(e) => setFavJohn(e.target.value)} required />
                <CameraCapture onCapture={(file) => {
                    setPhotoFile(file);
                    if (file) {
                        setSubmitError('');
                        setSubmitSuccess('');
                    }
                }} />

                {submitError ? <p className="signup-error">{submitError}</p> : null}
                {submitProgress ? <p className="signup-progress">{submitProgress}</p> : null}
                {submitSuccess ? <p className="signup-success">{submitSuccess}</p> : null}

                <button type="submit" className="signup-submit" disabled={!photoFile || isSubmitting}>
                    {isSubmitting ? 'Uploading...' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
}

export default Signup;