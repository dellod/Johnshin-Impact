// React libraries
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";

// Styles
import './styles/app.css';

// Components
import Header from './components/header';
import Signup from './components/signup';
import Login from './components/login';
import LoadingScreenVideo from './assets/loading_screen.mp4';
import LoadingScreenImage from './assets/loading_screen.jpg';
import Navbar from './components/navbar';
import Achievements from './components/achievements';
import Admin from './components/admin';
import Profile from './components/profile';
import Leaderboard from './components/leaderboard';
// Scripts
import { auth } from './scripts/firebase';

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
          <source src={LoadingScreenVideo} type="video/mp4" />
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
        <source src={LoadingScreenVideo} type="video/mp4" />
        <img src={LoadingScreenImage} alt="Loading background" />
      </video>

      <div className="bg-overlay" aria-hidden="true" />

      <Router>
        <div className="content-layer">
          <Navbar user={user} />
            <Routes>
              <Route path="/" element={<Header user={user} />} />
              <Route path="/signup" element={user ? <Header user={user} /> : <Signup />} />
              <Route path="/login" element={user ? <Header user={user} /> : <Login />} />
              <Route path="/achievements" element={<Achievements user={user} />} />
              <Route path="/leaderboard" element={<Leaderboard user={user} />} />
              <Route path="/profile/:slug" element={<ProfileRoute />} />
              <Route path="/admin" element={<Admin user={user} />} />
            </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
