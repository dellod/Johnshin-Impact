// React libraries
import React, { useState } from "react";

// CSS
import '../styles/signup.css';

// Components
import CameraCapture from './cameraCapture';

const Signup = () =>
{
    const [photoFile, setPhotoFile] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!photoFile) {
            setSubmitError('Please capture a photo before signing up.');
            return;
        }

        setSubmitError('');
    };

    return (
        <div className="signup">
            <h1>Signup</h1>
            <form className="signup-form" onSubmit={handleSubmit}>
                <input type="text" placeholder="Username" required />
                <input type="text" placeholder="I like John's ____" required />
                <CameraCapture onCapture={(file) => {
                    setPhotoFile(file);
                    if (file) {
                        setSubmitError('');
                    }
                }} />

                {submitError ? <p className="signup-error">{submitError}</p> : null}

                <button type="submit" className="signup-submit" disabled={!photoFile}>Sign Up</button>
            </form>
        </div>
    );
}

export default Signup;