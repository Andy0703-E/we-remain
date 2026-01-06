import React from 'react';
import { motion } from 'framer-motion';
import './LoadingScreen.css';

const LoadingScreen = () => {
    return (
        <motion.div
            className="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="logo-container"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.8,
                    ease: "easeOut"
                }}
            >
                <motion.h1
                    className="logo-text"
                    animate={{
                        textShadow: [
                            "0 0 20px rgba(159, 122, 234, 0.5)",
                            "0 0 40px rgba(159, 122, 234, 0.8)",
                            "0 0 20px rgba(159, 122, 234, 0.5)"
                        ]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    AE
                </motion.h1>

                <motion.div
                    className="loading-bar"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{
                        duration: 2.5,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>

            <motion.p
                className="loading-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                We Remain
            </motion.p>
        </motion.div>
    );
};

export default LoadingScreen;
