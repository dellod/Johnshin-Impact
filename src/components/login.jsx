// React libraries
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// CSS
import '../styles/login.css';

// Scripts
import { auth } from "../scripts/firebase";

const buildAuthEmail = (username) => `${username.trim().toLowerCase()}@johnshin.local`;

const getLoginErrorMessage = (error) => {
    if (error?.code === 'auth/invalid-email' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        return 'Invalid username or account credentials.';
    }

    return error?.message || 'Unable to log in right now.';
};

const Login = () =>
{
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginSuccess, setLoginSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            setLoginError('Username is required.');
            return;
        }

        setLoginError('');
        setLoginSuccess('');
        setIsSubmitting(true);

        try {
            const authEmail = buildAuthEmail(normalizedUsername);
            await auth.signInWithEmailAndPassword(authEmail, normalizedUsername);
            setLoginSuccess('Logged in successfully.');
            navigate('/');
        } catch (error) {
            setLoginError("Invalid username");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login">
            <h1>Login</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                />

                {loginError ? <p className="login-error">{loginError}</p> : null}
                {loginSuccess ? <p className="login-success">{loginSuccess}</p> : null}

                <button type="submit" className="login-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

export default Login;
