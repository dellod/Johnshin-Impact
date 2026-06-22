import React, { useEffect, useRef, useState } from 'react';
import '../styles/paimon.css';
import PaimonImage from '../assets/paimon.png';

const TIPS = [
    "Did you know, John's favourite character from Genshin Impact is Raiden Shogun",
    "Thirsty? Make sure to drink henny shots to earn achievements!",
    "Did you know, John loved to take naps during his Rona shifts?",
    "Did you know, John can bench 10 plates on each side?",
    "Did you know, one of John's favourite animes of all time is Reincarnated as a Slime?",
    "Did you know, one of John's least favourite animes of all time is Bleach?",
    "Did you know, one year, John cosplayed as Raiden Shogun for Otafest!"
];

const INITIAL_MIN_DELAY_MS = 60 * 1000;
const INITIAL_MAX_DELAY_MS = 180 * 1000;
const NEXT_MIN_DELAY_MS = 90 * 1000;
const NEXT_MAX_DELAY_MS = 4 * 60 * 1000;
const AUTO_HIDE_MS = 12000;

const getRandomDelay = (minDelayMs, maxDelayMs) =>
    Math.floor(Math.random() * (maxDelayMs - minDelayMs) + minDelayMs);

const getRandomTip = (lastTipIndex) => {
    if (TIPS.length <= 1) {
        return { index: 0, text: TIPS[0] || '' };
    }

    let nextIndex = Math.floor(Math.random() * TIPS.length);
    while (nextIndex === lastTipIndex) {
        nextIndex = Math.floor(Math.random() * TIPS.length);
    }

    return { index: nextIndex, text: TIPS[nextIndex] };
};

const Paimon = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentTip, setCurrentTip] = useState('');
    const timerRef = useRef(null);
    const autoHideTimerRef = useRef(null);
    const lastTipIndexRef = useRef(-1);

    const clearTimers = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (autoHideTimerRef.current) {
            clearTimeout(autoHideTimerRef.current);
            autoHideTimerRef.current = null;
        }
    };

    const showPaimon = () => {
        const nextTip = getRandomTip(lastTipIndexRef.current);
        lastTipIndexRef.current = nextTip.index;
        setCurrentTip(nextTip.text);
        setIsVisible(true);

        autoHideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            timerRef.current = setTimeout(showPaimon, getRandomDelay(NEXT_MIN_DELAY_MS, NEXT_MAX_DELAY_MS));
        }, AUTO_HIDE_MS);
    };

    const scheduleNextAppearance = (minDelayMs, maxDelayMs) => {
        clearTimers();
        timerRef.current = setTimeout(showPaimon, getRandomDelay(minDelayMs, maxDelayMs));
    };

    useEffect(() => {
        // Much less frequent initial appearance to avoid interrupting users right away.
        scheduleNextAppearance(INITIAL_MIN_DELAY_MS, INITIAL_MAX_DELAY_MS);

        return () => {
            clearTimers();
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        scheduleNextAppearance(NEXT_MIN_DELAY_MS, NEXT_MAX_DELAY_MS);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="paimon-container">
            <div className="paimon-character">
                <img
                    src={PaimonImage}
                    alt="Paimon"
                    className="paimon-image"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            </div>
            <div className="paimon-tip-bubble">
                <p className="paimon-tip-text">{currentTip}</p>
                <button
                    className="paimon-close-btn"
                    onClick={handleClose}
                    aria-label="Close Paimon tip"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Paimon;
