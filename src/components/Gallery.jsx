import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import './Gallery.css';

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .eq('category', 'studio')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (error) {
            console.error('Error fetching images:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="gallery">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                >
                    <h2 className="section-title">Potret dalam Diam</h2>
                    <p className="section-desc">Mewakili rasa yang tetap ada meski jarak memisahkan.</p>
                </motion.div>

                {loading ? (
                    <div className="loading-state">Mengambil kenangan...</div>
                ) : (
                    <div className="gallery-grid">
                        {images.map((img, index) => (
                            <motion.div
                                key={img.id}
                                className="gallery-item"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                            >
                                <div className="image-wrapper">
                                    <img src={img.url} alt={img.caption || `Studio ${img.id}`} loading="lazy" />
                                </div>
                                <div className="gallery-caption">
                                    <p>{img.caption || ""}</p>
                                </div>
                            </motion.div>
                        ))}
                        {images.length === 0 && (
                            <p className="empty-msg">Belum ada foto studio yang ditambahkan.</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Gallery;
