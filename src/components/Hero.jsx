import React from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
    return (
        <section className="hero">
            {/* Decorative Elements */}
            <div className="hero-decoration hero-decoration-left"></div>
            <div className="hero-decoration hero-decoration-right"></div>

            <div className="hero-content">
                <motion.div
                    className="decorative-line top"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                />

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
                    Tapi aku memilih kamu,<br />setiap hari.
                </motion.h1>

                <motion.div
                    className="hero-tagline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 3, delay: 2 }}
                >
                    <span className="serif">"Bukan seberapa sering kita bertemu,<br />tapi seberapa kuat kita bertahan."</span>
                </motion.div>

                <motion.div
                    className="decorative-line bottom"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, delay: 2.5 }}
                />
            </div>

            <motion.div
                className="scroll-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 3, duration: 2 }}
            >
                <span>Scroll untuk melihat</span>
                <div className="scroll-arrow">↓</div>
            </motion.div>
        </section>
    );
};

export default Hero;
