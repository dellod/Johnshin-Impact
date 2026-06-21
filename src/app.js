// React libraries
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useParams } from "react-router-dom";

// Styles
import './styles/app.css';

// Components
import Header from './components/header';
import Signup from './components/signup';
import Login from './components/login';
import LoadingScreenImage from './assets/loading_screen.jpg';

// Cloudinary loading screen video URL - set via environment variable
import Navbar from './components/navbar';
import Achievements from './components/achievements';
import Admin from './components/admin';
import Profile from './components/profile';
import Leaderboard from './components/leaderboard';
import Paimon from './components/paimon';

// Scripts
import { auth } from './scripts/firebase';

const LOADING_SCREEN_VIDEO_URL = 'https://res.cloudinary.com/defgxcpnk/video/upload/v1782048059/loading_screen_hdhggj.mp4';

const ProfileRoute = () => {
  const { slug } = useParams();
  return <Profile key={slug} />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes (persistent login)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <video
          className="bg-video"
          autoPlay
          loop
          muted
          playsInline
          poster={LoadingScreenImage}
        >
          <source src={LOADING_SCREEN_VIDEO_URL} type="video/mp4" />
          <img src={LoadingScreenImage} alt="Loading background" />
        </video>
        <div className="bg-overlay" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <video
        className="bg-video"
        autoPlay
        loop
        muted
        playsInline
        poster={LoadingScreenImage}
      >
        <source src={LOADING_SCREEN_VIDEO_URL} type="video/mp4" />
        <img src={LoadingScreenImage} alt="Loading background" />
      </video>

      <div className="bg-overlay" aria-hidden="true" />

      <Router>
        <div className="content-layer">
          <Navbar user={user} />
            <Routes>
              <Route path="/" element={<Header user={user} />} />
              <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/achievements" element={<Achievements user={user} />} />
              <Route path="/leaderboard" element={<Leaderboard user={user} />} />
              <Route path="/profile/:slug" element={<ProfileRoute />} />
              <Route path="/admin" element={<Admin user={user} />} />
            </Routes>
          <Paimon />
        </div>
      </Router>
    </div>
  );
}

export default App;
