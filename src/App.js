// React libraries
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Styles
import './styles/app.css';

// Components
import Header from './components/header';
import Signup from './components/signup';
import Login from './components/login';
import LoadingScreenVideo from './assets/loading_screen.mp4';
import LoadingScreenImage from './assets/loading_screen.jpg';
import Navbar from './components/navbar';

function App() {
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
          <Navbar />
            <Routes>
                <Route path="/" element={<Header />} />
                <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
            </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
