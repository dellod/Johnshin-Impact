// React libraries
import React, { useEffect, useRef, useState } from "react";

// CSS
import '../styles/cameraCapture.css';

const CameraCapture = ({
    onCapture,
    label = 'Take a photo',
    successMessage = 'Photo captured successfully.'
}) => {
    const [capturedFile, setCapturedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [cameraError, setCameraError] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState('environment');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);

    const canFlipCamera = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

    useEffect(() => {
        if (!capturedFile) {
            setPreviewUrl('');
            return;
        }

        const objectUrl = URL.createObjectURL(capturedFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [capturedFile]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsCameraActive(false);
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async (nextFacingMode = cameraFacingMode) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Your browser does not support camera capture.');
            return;
        }

        try {
            setCameraError('');
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: nextFacingMode } },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setIsCameraActive(true);
        } catch (error) {
            setCameraError('Camera access was denied. Please allow camera permission and try again.');
            setIsCameraActive(false);
        }
    };

    const handleFlipCamera = () => {
        const nextFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
        setCameraFacingMode(nextFacingMode);
        startCamera(nextFacingMode);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video.videoWidth || !video.videoHeight) {
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) {
                return;
            }

            const nextFile = new File([blob], `captured-${Date.now()}.jpg`, {
                type: 'image/jpeg'
            });

            setCapturedFile(nextFile);
            if (onCapture) {
                onCapture(nextFile);
            }
            stopCamera();
        }, 'image/jpeg', 0.92);
    };

    const handleRetake = () => {
        setCapturedFile(null);
        if (onCapture) {
            onCapture(null);
        }
        startCamera();
    };

    return (
        <div className="camera-capture">
            <label className="camera-label">{label}</label>
            <div className="camera-frame">
                {previewUrl ? (
                    <img className="photo-preview" src={previewUrl} alt="Captured profile preview" />
                ) : (
                    <video
                        className={`camera-video ${isCameraActive && cameraFacingMode === 'user' ? 'is-mirrored' : ''}`}
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                    />
                )}
            </div>

            <canvas ref={canvasRef} className="capture-canvas" aria-hidden="true" />

            <div className="camera-controls">
                {!isCameraActive && !previewUrl ? (
                    <button type="button" className="camera-btn camera-btn-secondary" onClick={startCamera}>Open Camera</button>
                ) : null}

                {isCameraActive ? (
                    <button type="button" className="camera-btn camera-btn-primary" onClick={handleCapture}>Capture Photo</button>
                ) : null}

                {isCameraActive && canFlipCamera ? (
                    <button type="button" className="camera-btn camera-btn-secondary" onClick={handleFlipCamera}>
                        {cameraFacingMode === 'environment' ? 'Use Front Camera' : 'Use Rear Camera'}
                    </button>
                ) : null}

                {previewUrl ? (
                    <button type="button" className="camera-btn camera-btn-secondary" onClick={handleRetake}>Retake</button>
                ) : null}
            </div>

            {/* {cameraError ? <p className="camera-error">{cameraError}</p> : null}
            {previewUrl ? <p className="camera-success">{successMessage}</p> : null} */}
        </div>
    );
};

export default CameraCapture;
