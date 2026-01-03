import React from 'react';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import Highlight from '../components/Highlight';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        >
            <Hero />
            <Gallery />
            <Highlight />
            <Footer />
        </motion.main>
    );
};

export default Home;
