import React from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            <div className="hero-content">
                <motion.p
                    className="hero-subline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 2, delay: 0.5 }}
                >
                    Kita tidak sering bertemu.
                </motion.p>

                <motion.h1
                    className="hero-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 2, delay: 1 }}
                >
                    Tapi aku memilih kamu, setiap hari.
                </motion.h1>

                <motion.div
                    className="hero-tagline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 3, delay: 2 }}
                >
                    <span className="serif">“Bukan seberapa sering kita bertemu, tapi seberapa kuat kita bertahan.”</span>
                </motion.div>
            </div>

            <motion.div
                className="scroll-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 3, duration: 2 }}
            >
                <span>Scroll untuk melihat</span>
            </motion.div>
        </section>
    );
};

export default Hero;
