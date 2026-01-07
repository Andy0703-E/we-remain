import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Note: You need to add 'perfect.mp3' to src/assets/
import musicFile from '../assets/perfect.mp3';

const BackgroundMusic = () => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        // Attempt auto-play when component mounts
        const playAudio = async () => {
            try {
                if (audioRef.current) {
                    audioRef.current.volume = 0.5; // Start at 50% volume
                    await audioRef.current.play();
                    setIsPlaying(true);
                }
            } catch (err) {
                console.log("Autoplay blocked by browser, waiting for user interaction");
            }
        };

        // Try to play on first click anywhere if autoplay failed
        const handleInteraction = () => {
            if (audioRef.current && !isPlaying) {
                playAudio();
            }
        };

        window.addEventListener('click', handleInteraction, { once: true });

        // Initial attempt
        playAudio();

        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        }}>
            <audio ref={audioRef} src={musicFile} loop />

            <AnimatePresence mode="wait">
                {minimized ? (
                    <motion.button
                        key="minimized"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setMinimized(false)}
                        style={{
                            background: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Music size={20} color={isPlaying ? "var(--accent)" : "var(--text-secondary)"} />
                    </motion.button>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            padding: '10px 15px',
                            borderRadius: '25px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Perfect</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ed Sheeran</span>
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />

                        <button onClick={togglePlay} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>

                        <button onClick={toggleMute} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>

                        <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '5px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BackgroundMusic;
